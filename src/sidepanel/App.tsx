import { useState } from "react"
import { EmptyState } from "./EmptyState"
import { Footer } from "./Footer"
import { Header } from "./Header"
import { SettingsView } from "./SettingsView"
import { connectActiveTab, type PanelStatus } from "./session"

type View = "capture" | "settings"

export function App() {
  const [view, setView] = useState<View>("capture")
  const [panelStatus, setPanelStatus] = useState<PanelStatus>({ status: "idle" })

  async function handleSelectSection(): Promise<void> {
    setPanelStatus({ status: "working" })
    const next = await connectActiveTab()
    setPanelStatus(next)
  }

  return (
    <div className="app">
      <Header
        onOpenSettings={() => setView("settings")}
        settingsOpen={view === "settings"}
      />
      <main className="main">
        {view === "capture" ? (
          <EmptyState status={panelStatus} onSelect={() => void handleSelectSection()} />
        ) : (
          <SettingsView onBack={() => setView("capture")} />
        )}
      </main>
      <Footer />
    </div>
  )
}
