import { useState } from "react"
import type { SectionSnapshot } from "../analyzer/snapshot.ts"
import type { GenerationStage } from "../ai/generate.ts"
import { STACKS, type StackId } from "../ai/stacks.ts"
import { copyText, downloadDataUrl } from "./files.ts"

type CapturedViewProps = {
  snapshot: SectionSnapshot
  previewUrl: string | null
  clipped: boolean
  busy: boolean
  note: string | null
  stack: StackId
  generation: "idle" | GenerationStage
  prompt: string | null
  onStack: (stack: StackId) => void
  onGenerate: () => void
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
  stack,
  generation,
  prompt,
  onStack,
  onGenerate,
  onParent,
  onSmaller,
  onPickAnother,
}: CapturedViewProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const styleEntries = Object.entries(snapshot.style).slice(0, 6)
  const generating = generation !== "idle"

  async function handleCopy(): Promise<void> {
    if (!prompt) return
    try {
      await copyText(prompt)
      setCopyError(null)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      setCopied(false)
      setCopyError(error instanceof Error ? error.message : "Could not copy the prompt.")
    }
  }

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
        <button type="button" className="ghost" onClick={onParent} disabled={busy || generating}>
          Parent
        </button>
        <button type="button" className="ghost" onClick={onSmaller} disabled={busy || generating}>
          Smaller
        </button>
        <button type="button" className="ghost" onClick={onPickAnother} disabled={busy || generating}>
          Pick another
        </button>
      </div>
      <label>
        Build with
        <select
          value={stack}
          disabled={busy || generating}
          onChange={(event) => {
            const next = STACKS.find((item) => item.id === event.target.value)
            if (next) onStack(next.id)
          }}
        >
          {STACKS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="primary"
        onClick={onGenerate}
        disabled={busy || generating}
        aria-busy={generating}
      >
        {generationLabel(generation)}
      </button>
      {generating ? (
        <p className="status status-selecting" role="status">
          {generation === "analyzing" ? "Analyzing section..." : "Generating reconstruction prompt..."}
        </p>
      ) : null}
      {prompt ? (
        <>
          <h3 className="prompt-title">Reconstruction prompt</h3>
          <textarea className="prompt" readOnly value={prompt} aria-label="Reconstruction prompt" />
          <p className="meta">Ready for Cursor, Claude Code, Codex, or another coding agent.</p>
          <div className="adjust">
            <button type="button" className="ghost" onClick={() => void handleCopy()}>
              {copied ? "Copied" : "Copy Prompt"}
            </button>
            <button
              type="button"
              className="ghost"
              disabled={!previewUrl}
              onClick={() => {
                if (previewUrl) downloadDataUrl(previewUrl, "pixel2prompt-reference.png")
              }}
            >
              Download PNG
            </button>
          </div>
        </>
      ) : null}
      {note ? (
        <p className="status status-error" role="status">
          {note}
        </p>
      ) : null}
      {copyError ? <p className="status status-error">{copyError}</p> : null}
    </section>
  )
}

function generationLabel(generation: "idle" | GenerationStage): string {
  if (generation === "analyzing") return "Analyzing section..."
  if (generation === "writing") return "Generating prompt..."
  return "Generate Prompt"
}
