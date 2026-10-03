import { useEffect, useRef, useState } from "react"
import { isClipped, type CaptureFrame, type SectionSnapshot } from "../analyzer/snapshot.ts"
import { generateReconstructionPrompt } from "../ai/generate.ts"
import { createSingleFlight } from "../ai/single-flight.ts"
import type { StackId } from "../ai/stacks.ts"
import { loadSettings } from "../storage/settings.ts"
import { isSectionCapturedMessage, isSelectionCancelledMessage } from "../types/messages"
import { CapturedView } from "./CapturedView"
import { cropScreenshot } from "./crop"
import { EmptyState } from "./EmptyState"
import { Footer } from "./Footer"
import { Header } from "./Header"
import { SettingsView } from "./SettingsView"
import {
  adjustSelection,
  armSelection,
  captureTabImage,
  stopSelection,
  type ActiveTab,
} from "./session"

type View = "capture" | "settings"

type CapturedPhase = {
  status: "captured"
  snapshot: SectionSnapshot
  frame: CaptureFrame
  previewUrl: string | null
  pageUrl: string
  capturedAt: string
  note: string | null
  stack: StackId
  generation: "idle" | "analyzing" | "writing"
  prompt: string | null
  jevUsed: boolean | null
}

type Phase =
  | { status: "idle" }
  | { status: "working" }
  | { status: "selecting" }
  | { status: "capturing" }
  | { status: "restricted" }
  | { status: "error"; message: string }
  | CapturedPhase

const emptyCapture = {
  stack: "existing" as const,
  generation: "idle" as const,
  prompt: null,
  jevUsed: null,
}

async function captureContext(tabId: number): Promise<{ pageUrl: string; capturedAt: string }> {
  let pageUrl = ""
  try {
    pageUrl = (await chrome.tabs.get(tabId)).url ?? ""
  } catch {
    pageUrl = ""
  }
  return { pageUrl, capturedAt: new Date().toISOString() }
}

function sameCapture(current: Phase, captured: CapturedPhase): current is CapturedPhase {
  return current.status === "captured" && current.snapshot === captured.snapshot && current.stack === captured.stack
}

export function App() {
  const [view, setView] = useState<View>("capture")
  const [phase, setPhase] = useState<Phase>({ status: "idle" })
  const tabRef = useRef<ActiveTab | null>(null)
  const once = useRef(createSingleFlight())

  useEffect(() => {
    const listener = (message: unknown) => {
      if (isSelectionCancelledMessage(message)) {
        setPhase((current) => (current.status === "selecting" ? { status: "idle" } : current))
        return
      }
      if (!isSectionCapturedMessage(message)) return
      void finishCapture(message.snapshot, message.frame)
    }

    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function handleSelectSection(): Promise<void> {
    await once.current(async () => {
      if (phase.status === "selecting" && tabRef.current) {
        await stopSelection(tabRef.current.id).catch(() => undefined)
        setPhase({ status: "idle" })
        return
      }

      setPhase({ status: "working" })
      const armed = await armSelection()
      if (!armed.ok) {
        setPhase(armed.status === "restricted" ? { status: "restricted" } : { status: "error", message: armed.message })
        return
      }
      tabRef.current = armed.tab
      setPhase({ status: "selecting" })
    })
  }

  async function finishCapture(snapshot: SectionSnapshot, frame: CaptureFrame): Promise<void> {
    const tab = tabRef.current
    if (!tab) return
    await once.current(async () => {
      setPhase({ status: "capturing" })
      try {
        const shot = await captureTabImage(tab.windowId)
        const previewUrl = await cropScreenshot(shot, frame)
        setPhase({
          status: "captured",
          snapshot,
          frame,
          previewUrl,
          note: null,
          ...(await captureContext(tab.id)),
          ...emptyCapture,
        })
      } catch (error) {
        setPhase({
          status: "captured",
          snapshot,
          frame,
          previewUrl: null,
          note: error instanceof Error ? error.message : "Could not capture the screenshot.",
          ...(await captureContext(tab.id)),
          ...emptyCapture,
        })
      }
    })
  }

  async function handleAdjust(direction: "parent" | "smaller"): Promise<void> {
    const tab = tabRef.current
    if (!tab || phase.status !== "captured") return
    const previous = phase
    await once.current(async () => {
      setPhase({ status: "capturing" })
      try {
        const next = await adjustSelection(tab.id, direction)
        const shot = await captureTabImage(tab.windowId)
        const previewUrl = await cropScreenshot(shot, next.frame)
        setPhase({
          status: "captured",
          snapshot: next.snapshot,
          frame: next.frame,
          previewUrl,
          note: null,
          ...(await captureContext(tab.id)),
          stack: previous.stack,
          generation: "idle",
          prompt: null,
          jevUsed: null,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not adjust the section."
        setPhase({ ...previous, note: message })
      }
    })
  }

  async function handleGenerate(): Promise<void> {
    if (phase.status !== "captured") return
    const captured = phase
    await once.current(async () => {
      try {
        const settings = await loadSettings()
        const result = await generateReconstructionPrompt({
          snapshot: captured.snapshot,
          stack: captured.stack,
          settings,
          onStage: (stage) => {
            setPhase((current) =>
              sameCapture(current, captured) ? { ...current, generation: stage, note: null } : current,
            )
          },
        })
        setPhase((current) =>
          sameCapture(current, captured)
            ? { ...current, generation: "idle", prompt: result.prompt, jevUsed: result.jevUsed, note: null }
            : current,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not generate a prompt."
        setPhase((current) =>
          sameCapture(current, captured) ? { ...current, generation: "idle", note: message } : current,
        )
      }
    })
  }

  function handleStack(stack: StackId): void {
    setPhase((current) =>
      current.status === "captured" ? { ...current, stack, prompt: null, jevUsed: null, generation: "idle" } : current,
    )
  }

  const emptyStatus =
    phase.status === "captured"
      ? { status: "idle" as const }
      : phase.status === "selecting"
        ? { status: "selecting" as const }
        : phase.status === "capturing"
          ? { status: "capturing" as const }
          : phase

  return (
    <div className="app">
      <Header onOpenSettings={() => setView("settings")} settingsOpen={view === "settings"} />
      <main className="main">
        {view === "settings" ? (
          <SettingsView onBack={() => setView("capture")} />
        ) : phase.status === "captured" ? (
          <CapturedView
            snapshot={phase.snapshot}
            previewUrl={phase.previewUrl}
            pageUrl={phase.pageUrl}
            capturedAt={phase.capturedAt}
            viewportWidth={phase.frame.viewportWidth}
            viewportHeight={phase.frame.viewportHeight}
            clipped={isClipped(phase.snapshot, phase.frame)}
            busy={false}
            note={phase.note}
            stack={phase.stack}
            generation={phase.generation}
            prompt={phase.prompt}
            jevUsed={phase.jevUsed}
            onStack={handleStack}
            onGenerate={() => void handleGenerate()}
            onParent={() => void handleAdjust("parent")}
            onSmaller={() => void handleAdjust("smaller")}
            onPickAnother={() => void handleSelectSection()}
          />
        ) : (
          <EmptyState status={emptyStatus} onSelect={() => void handleSelectSection()} />
        )}
      </main>
      <Footer />
    </div>
  )
}
