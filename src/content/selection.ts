import { createSnapshot, visibleFrame, type CaptureFrame, type SectionSnapshot } from "../analyzer/snapshot.ts"
import { mountHighlight, type Highlight } from "./highlight.ts"
import { parentSection, pickSection, smallerSection } from "./pick-section.ts"

export type PreparedSection = {
  snapshot: SectionSnapshot
  frame: CaptureFrame
}

type SelectionController = {
  start(): void
  stop(): void
  adjust(direction: "parent" | "smaller"): Promise<PreparedSection>
}

export function createSelection(onCancel: () => void): SelectionController {
  let active = false
  let busy = false
  let rafId = 0
  let pointerX = 0
  let pointerY = 0
  let current: Element | null = null
  let anchorX = 0
  let anchorY = 0
  let highlight: Highlight | null = null
  let previousCursor = ""

  function start(): void {
    if (active) return
    active = true
    busy = false
    previousCursor = document.documentElement.style.cursor
    document.documentElement.style.cursor = "crosshair"
    document.addEventListener("mousemove", onMouseMove, true)
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("click", blockEvent, true)
    document.addEventListener("auxclick", blockEvent, true)
    document.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("scroll", onScroll, true)
  }

  function stop(keepTarget = false): void {
    if (!active && !highlight) return
    active = false
    if (!keepTarget) current = null
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    document.removeEventListener("mousemove", onMouseMove, true)
    document.removeEventListener("pointerdown", onPointerDown, true)
    document.removeEventListener("click", blockEvent, true)
    document.removeEventListener("auxclick", blockEvent, true)
    document.removeEventListener("keydown", onKeyDown, true)
    window.removeEventListener("scroll", onScroll, true)
    document.documentElement.style.cursor = previousCursor
    highlight?.hide()
    highlight = null
  }

  async function adjust(direction: "parent" | "smaller"): Promise<PreparedSection> {
    if (!current) throw new Error("Select a section first.")
    const next = direction === "parent" ? parentSection(current) : smallerSection(current, anchorX, anchorY)
    if (!next) {
      throw new Error(
        direction === "parent"
          ? "Already at the top of this section."
          : "This section has no smaller part.",
      )
    }
    anchorX = centerX(next)
    anchorY = centerY(next)
    return prepare(next)
  }

  function onMouseMove(event: MouseEvent): void {
    pointerX = event.clientX
    pointerY = event.clientY
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      const next = pickSection(pointerX, pointerY)
      if (next === current) return
      current = next
      if (!next) {
        highlight?.hide()
        highlight = null
        return
      }
      paint(next)
    })
  }

  function onScroll(): void {
    if (!current || rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (current) paint(current)
    })
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !active) return
    event.preventDefault()
    stop()
    onCancel()
  }

  function onPointerDown(event: PointerEvent): void {
    if (!active || busy || event.button !== 0) return
    blockEvent(event)
    const section = current ?? pickSection(event.clientX, event.clientY)
    if (!section) return
    anchorX = event.clientX
    anchorY = event.clientY
    busy = true
    pauseHover()
    void prepare(section)
      .then((prepared) => {
        stop(true)
        void chrome.runtime.sendMessage({
          type: "SECTION_CAPTURED",
          snapshot: prepared.snapshot,
          frame: prepared.frame,
        })
      })
      .catch(() => {
        busy = false
        if (!active) return
        document.addEventListener("mousemove", onMouseMove, true)
        window.addEventListener("scroll", onScroll, true)
      })
  }

  async function prepare(element: Element): Promise<PreparedSection> {
    if (reveal(element)) await nextPaint()
    await nextPaint()
    current = element
    const frameRect = visibleFrame(element)
    if (!frameRect) throw new Error("That section is outside the visible page.")
    return { snapshot: createSnapshot(element), frame: frameRect }
  }

  function pauseHover(): void {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    document.removeEventListener("mousemove", onMouseMove, true)
    window.removeEventListener("scroll", onScroll, true)
    highlight?.hide()
    highlight = null
  }

  function paint(element: Element): void {
    const rect = element.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    highlight ??= mountHighlight()
    highlight.show(rect, `Section · ${Math.round(rect.width)} × ${Math.round(rect.height)}`)
  }

  return { start, stop, adjust }
}

function reveal(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  const visible =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  if (visible) return false
  element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" })
  return true
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

function blockEvent(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

function centerX(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.left + rect.width / 2
}

function centerY(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.top + rect.height / 2
}
