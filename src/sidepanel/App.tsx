import { useEffect, useRef, useState } from "react"
import { isClipped, type CaptureFrame, type SectionSnapshot } from "../analyzer/snapshot.ts"
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

type Phase =
  | { status: "idle" }
  | { status: "working" }
  | { status: "selecting" }
  | { status: "capturing" }
  | { status: "restricted" }
  | { status: "error"; message: string }
  | {
      status: "captured"
      snapshot: SectionSnapshot
      frame: CaptureFrame
      previewUrl: string | null
      note: string | null
    }

export function App() {
  const [view, setView] = useState<View>("capture")
  const [phase, setPhase] = useState<Phase>({ status: "idle" })
  const tabRef = useRef<ActiveTab | null>(null)
  const captureLock = useRef(false)

  useEffect(() => {
    const listener = (message: unknown) => {
      if (isSelectionCancelledMessage(message)) {
        setPhase((current) => (current.status === "selecting" ? { status: "idle" } : current))
        return
      }
      if (!isSectionCapturedMessage(message)) return
      void finishCapture(message.snapshot, message.frame)
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function handleSelectSection(): Promise<void> {
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
  }

  async function finishCapture(snapshot: SectionSnapshot, frame: CaptureFrame): Promise<void> {
    if (captureLock.current) return
    const tab = tabRef.current
    if (!tab) return
    captureLock.current = true
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
      })
    } catch (error) {
      setPhase({
        status: "captured",
        snapshot,
        frame,
        previewUrl: null,
        note: error instanceof Error ? error.message : "Could not capture the screenshot.",
      })
    } finally {
      captureLock.current = false
    }
  }

  async function handleAdjust(direction: "parent" | "smaller"): Promise<void> {
    const tab = tabRef.current
    if (!tab || captureLock.current) return
    captureLock.current = true
    setPhase((current) => (current.status === "captured" ? { ...current, note: null } : { status: "capturing" }))
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
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not adjust the section."
      setPhase((current) =>
        current.status === "captured" ? { ...current, note: message } : { status: "error", message },
      )
    } finally {
      captureLock.current = false
    }
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
            clipped={isClipped(phase.snapshot, phase.frame)}
            busy={captureLock.current}
            note={phase.note}
            onParent={() => void handleAdjust("parent")}
            onSmaller={() => void handleAdjust("smaller")}
            onPickAnother={() => void handleSelectSection()}
          />
        ) : (
          <EmptyState
            status={emptyStatus}
            onSelect={() => void handleSelectSection()}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}
