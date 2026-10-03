type HeaderProps = {
  onOpenSettings: () => void
  settingsOpen: boolean
}

export function Header({ onOpenSettings, settingsOpen }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <Mark />
        <div>
          <h1>Pixel2Prompt</h1>
          <p className="tagline">See It. Capture It. Rebuild It.</p>
        </div>
      </div>
      {settingsOpen ? null : (
        <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="Settings">
          <Gear />
        </button>
      )}
    </header>
  )
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#16191f" />
      <path
        d="M9 13V10.2A1.2 1.2 0 0 1 10.2 9H13M19 9h2.8A1.2 1.2 0 0 1 23 10.2V13M23 19v2.8a1.2 1.2 0 0 1-1.2 1.2H19M13 23h-2.8A1.2 1.2 0 0 1 9 21.8V19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="13" y="13" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

function Gear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.8 1.2h2.4l.3 1.6a4.8 4.8 0 0 1 1.3.8l1.5-.6 1.2 2.1-1.2 1.1a4.7 4.7 0 0 1 0 1.6l1.2 1.1-1.2 2.1-1.5-.6a4.8 4.8 0 0 1-1.3.8l-.3 1.6H6.8l-.3-1.6a4.8 4.8 0 0 1-1.3-.8l-1.5.6-1.2-2.1 1.2-1.1a4.7 4.7 0 0 1 0-1.6L2.5 5.1l1.2-2.1 1.5.6a4.8 4.8 0 0 1 1.3-.8l.3-1.6ZM8 10.1A2.1 2.1 0 1 0 8 5.9a2.1 2.1 0 0 0 0 4.2Z"
      />
    </svg>
  )
}
