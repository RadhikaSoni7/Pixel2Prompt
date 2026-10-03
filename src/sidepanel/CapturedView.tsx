import type { SectionSnapshot } from "../analyzer/snapshot.ts"

type CapturedViewProps = {
  snapshot: SectionSnapshot
  previewUrl: string | null
  clipped: boolean
  busy: boolean
  note: string | null
  onParent: () => void
  onSmaller: () => void
  onPickAnother: () => void
}

export function CapturedView({
  snapshot,
  previewUrl,
  clipped,
  busy,
  note,
  onParent,
  onSmaller,
  onPickAnother,
}: CapturedViewProps) {
  const styleEntries = Object.entries(snapshot.style).slice(0, 6)

  return (
    <section className="captured" aria-labelledby="captured-title">
      <p className="eyebrow">Section captured</p>
      <h2 id="captured-title">{snapshot.tag}</h2>
      {previewUrl ? (
        <div className="preview">
          <img src={previewUrl} alt="Reference screenshot of the selected section" />
        </div>
      ) : (
        <p className="status status-error">The screenshot could not be cropped.</p>
      )}
      <p className="meta">
        {snapshot.width} × {snapshot.height}
        <span> · </span>
        {snapshot.elementCount} elements
        {snapshot.imageCount > 0 ? ` · ${snapshot.imageCount} images` : ""}
        {snapshot.svgCount > 0 ? ` · ${snapshot.svgCount} SVG` : ""}
      </p>
      {clipped ? <p className="note">Showing the visible portion of a taller section.</p> : null}
      {snapshot.text ? <p className="sample">{snapshot.text}</p> : null}
      {styleEntries.length > 0 ? (
        <ul className="chips">
          {styleEntries.map(([property, value]) => (
            <li key={property}>
              <span>{property}</span>
              {value}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="adjust">
        <button type="button" className="ghost" onClick={onParent} disabled={busy}>
          Parent
        </button>
        <button type="button" className="ghost" onClick={onSmaller} disabled={busy}>
          Smaller
        </button>
        <button type="button" className="ghost" onClick={onPickAnother} disabled={busy}>
          Pick another
        </button>
      </div>
      {note ? (
        <p className="status status-error" role="status">
          {note}
        </p>
      ) : null}
    </section>
  )
}
