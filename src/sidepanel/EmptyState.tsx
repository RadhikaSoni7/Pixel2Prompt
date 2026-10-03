import type { PanelStatus } from "./session"

type EmptyStateProps = {
  status: PanelStatus
  onSelect: () => void
}

export function EmptyState({ status, onSelect }: EmptyStateProps) {
  const working = status.status === "working"

  return (
    <section className="empty" aria-labelledby="capture-title">
      <p className="eyebrow">Capture</p>
      <h2 id="capture-title">Capture any website section</h2>
      <p className="lede">
        Select a section from the current webpage and turn it into an AI-ready
        reconstruction prompt.
      </p>
      <button
        type="button"
        className="primary"
        onClick={onSelect}
        disabled={working}
        aria-busy={working}
      >
        {working ? "Connecting..." : "Select Section"}
      </button>
      <p className={`status status-${status.status}`} role="status" aria-live="polite">
        {statusMessage(status)}
      </p>
    </section>
  )
}

function statusMessage(status: PanelStatus): string {
  switch (status.status) {
    case "idle":
      return "Open a normal website, then select a section."
    case "working":
      return "Connecting to this page..."
    case "connected":
      return "Page connected. Highlighting is not active in this build."
    case "restricted":
      return "This page can't be captured. Open a normal website and click the Pixel2Prompt icon."
    case "error":
      return status.message
  }
}
