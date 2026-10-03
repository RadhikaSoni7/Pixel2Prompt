type HeaderProps = {
  onOpenSettings: () => void
  settingsOpen: boolean
}

export function Header({ onOpenSettings, settingsOpen }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <img className="logo" src="/logo.png" alt="" width={28} height={28} />
        <h1>Pixel2Prompt</h1>
      </div>
      {settingsOpen ? null : (
        <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="Settings">
          <Gear />
        </button>
      )}
    </header>
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
