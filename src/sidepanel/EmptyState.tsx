type EmptyStatus =
  | { status: "idle" }
  | { status: "working" }
  | { status: "selecting" }
  | { status: "capturing" }
  | { status: "restricted" }
  | { status: "error"; message: string }

type EmptyStateProps = {
  status: EmptyStatus
  onSelect: () => void
}

export function EmptyState({ status, onSelect }: EmptyStateProps) {
  const working = status.status === "working" || status.status === "capturing"
  const selecting = status.status === "selecting"
  const failed = status.status === "error" || status.status === "restricted"

  return (
    <section className="empty" aria-labelledby="capture-title">
      <p className="eyebrow">
        <span className={failed ? "dot bad" : working || selecting ? "dot busy" : "dot"} />
        {eyebrow(status)}
      </p>
      <h2 id="capture-title">See It. Capture It. Rebuild It.</h2>
      <p className="lede">
        Select a section, then generate a reconstruction prompt for Cursor, Claude Code, or Codex.
      </p>
      <button type="button" className="primary" onClick={onSelect} disabled={working} aria-busy={working}>
        {working ? <span className="spinner" aria-hidden="true" /> : null}
        {buttonLabel(status, selecting)}
      </button>
      <p className={`banner ${failed ? "bad" : working || selecting ? "busy" : "quiet"}`} role="status" aria-live="polite">
        {statusMessage(status)}
      </p>
    </section>
  )
}

function eyebrow(status: EmptyStatus): string {
  if (status.status === "selecting") return "Selecting"
  if (status.status === "working" || status.status === "capturing") return "Working"
  if (status.status === "error" || status.status === "restricted") return "Needs attention"
  return "Ready"
}

function buttonLabel(status: EmptyStatus, selecting: boolean): string {
  if (status.status === "capturing") return "Capturing..."
  if (status.status === "working") return "Connecting..."
  if (selecting) return "Cancel"
  return "Select section"
}

function statusMessage(status: EmptyStatus): string {
  switch (status.status) {
    case "idle":
      return "Open a normal website, then select a section."
    case "working":
      return "Connecting to this page..."
    case "selecting":
      return "Drag a rectangle around the section, like the Snipping Tool. Press Esc to cancel."
    case "capturing":
      return "Capturing the section..."
    case "restricted":
      return "This page can't be captured. Open a normal website and click the Pixel2Prompt icon."
    case "error":
      return status.message
  }
}
