import { createSnapshot, visibleFrame, type CaptureFrame, type SectionSnapshot } from "../analyzer/snapshot.ts"
import { parentSection, pickSection, smallerSection } from "./pick-section.ts"
import { snipBox, type SnipBox } from "./snip.ts"
import { mountSnipOverlay, type SnipOverlay } from "./snip-overlay.ts"

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
  let current: Element | null = null
  let anchorX = 0
  let anchorY = 0
  let dragX = 0
  let dragY = 0
  let dragging = false
  let overlay: SnipOverlay | null = null

  function start(): void {
    if (active) return
    active = true
    busy = false
    dragging = false
    overlay = mountSnipOverlay()
    overlay.host.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown, true)
  }

  function stop(keepTarget = false): void {
    if (!active && !overlay) return
    active = false
    dragging = false
    if (!keepTarget) current = null
    overlay?.host.removeEventListener("pointerdown", onPointerDown)
    overlay?.host.removeEventListener("pointermove", onPointerMove)
    overlay?.host.removeEventListener("pointerup", onPointerUp)
    document.removeEventListener("keydown", onKeyDown, true)
    overlay?.remove()
    overlay = null
  }

  async function adjust(direction: "parent" | "smaller"): Promise<PreparedSection> {
    if (!current) throw new Error("Select a section first.")
    const next = direction === "parent" ? parentSection(current) : smallerSection(current, anchorX, anchorY)
    if (!next) {
      throw new Error(
        direction === "parent" ? "Already at the top of this section." : "This section has no smaller part.",
      )
    }
    anchorX = centerX(next)
    anchorY = centerY(next)
    const frame = visibleFrame(next)
    if (!frame) throw new Error("That section is outside the visible page.")
    current = next
    return { snapshot: createSnapshot(next), frame }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !active) return
    event.preventDefault()
    event.stopPropagation()
    stop()
    onCancel()
  }

  function onPointerDown(event: PointerEvent): void {
    if (!active || busy || event.button !== 0 || !overlay) return
    event.preventDefault()
    event.stopPropagation()
    dragging = true
    dragX = event.clientX
    dragY = event.clientY
    anchorX = event.clientX
    anchorY = event.clientY
    overlay.host.setPointerCapture(event.pointerId)
    overlay.host.addEventListener("pointermove", onPointerMove)
    overlay.host.addEventListener("pointerup", onPointerUp)
    overlay.host.addEventListener("pointercancel", onPointerUp)
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging || !overlay) return
    event.preventDefault()
    const box = snipBox(dragX, dragY, event.clientX, event.clientY, window.innerWidth, window.innerHeight, 1)
    if (!box) {
      overlay.hideBox()
      return
    }
    overlay.showBox(box)
  }

  function onPointerUp(event: PointerEvent): void {
    if (!dragging || !overlay) return
    dragging = false
    overlay.host.removeEventListener("pointermove", onPointerMove)
    overlay.host.removeEventListener("pointerup", onPointerUp)
    overlay.host.removeEventListener("pointercancel", onPointerUp)
    const box = snipBox(dragX, dragY, event.clientX, event.clientY, window.innerWidth, window.innerHeight)
    if (!box) {
      overlay.hideBox()
      return
    }
    busy = true
    anchorX = box.x + box.width / 2
    anchorY = box.y + box.height / 2
    overlay.remove()
    overlay = null
    void finishSnip(box)
  }

  async function finishSnip(box: SnipBox): Promise<void> {
    await nextPaint()
    await nextPaint()
    const element = pickSection(anchorX, anchorY)
    current = element
    const prepared = {
      snapshot: snapshotForSnip(element, box),
      frame: frameFromBox(box),
    }
    stop(true)
    void chrome.runtime.sendMessage({
      type: "SECTION_CAPTURED",
      snapshot: prepared.snapshot,
      frame: prepared.frame,
    })
  }

  return { start, stop, adjust }
}

function snapshotForSnip(element: Element | null, box: SnipBox): SectionSnapshot {
  if (!element) {
    return {
      tag: "region",
      id: null,
      className: null,
      role: null,
      width: box.width,
      height: box.height,
      elementCount: 0,
      imageCount: 0,
      svgCount: 0,
      text: "",
      style: {},
      children: [],
    }
  }

  return {
    ...createSnapshot(element),
    width: box.width,
    height: box.height,
  }
}

function frameFromBox(box: SnipBox): CaptureFrame {
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

function centerX(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.left + rect.width / 2
}

function centerY(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.top + rect.height / 2
}
