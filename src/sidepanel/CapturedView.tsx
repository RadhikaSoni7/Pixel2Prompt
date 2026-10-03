import { useState } from "react"
import type { SectionSnapshot } from "../analyzer/snapshot.ts"
import type { GenerationStage } from "../ai/generate.ts"
import { STACKS, type StackId } from "../ai/stacks.ts"
import { copyText, downloadDataUrl, downloadText } from "./files.ts"

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
  const [locked, setLocked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const generating = generation !== "idle"
  const frozen = busy || generating || locked
  const assets = snapshot.imageCount + snapshot.svgCount

  async function handleCopy(): Promise<void> {
    if (!prompt) return
    try {
      await copyText(prompt)
      setCopyError(null)
      setCopied(true)
    } catch (error) {
      setCopied(false)
      setCopyError(error instanceof Error ? error.message : "Could not copy the prompt.")
    }
  }

  return (
    <section className="captured" aria-labelledby="captured-title">
      <p className="eyebrow">
        <span className={generating ? "dot busy" : "dot"} />
        {generating ? "Working" : "Section captured"}
      </p>
      <h2 id="captured-title">See It. Capture It. Rebuild It.</h2>
      <p className="lede">Copy the prompt and attach the reference image to Cursor, Claude Code, or Codex.</p>

      <div className="glass fact">
        <code className="selector">{sectionLabel(snapshot)}</code>
        <p className="meta">
          {snapshot.width} × {snapshot.height} px · {snapshot.elementCount} elements · {assets} assets
        </p>
      </div>
      {clipped ? <p className="banner warn">Showing the visible portion of a taller section.</p> : null}

      <div className="adjust">
        <button type="button" className="ghost" onClick={onParent} disabled={frozen}>
          Parent
        </button>
        <button type="button" className="ghost" onClick={onSmaller} disabled={frozen}>
          Smaller
        </button>
        <button type="button" className="ghost" onClick={onPickAnother} disabled={frozen}>
          Pick another
        </button>
        <button
          type="button"
          className={locked ? "ghost locked" : "ghost"}
          aria-pressed={locked}
          disabled={busy || generating}
          onClick={() => setLocked((current) => !current)}
        >
          {locked ? "Unlock" : "Lock section"}
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

      {prompt ? (
        <>
          <div className="prompt-head">
            <h3>Reconstruction prompt</h3>
            <span>{formatCount(prompt.length)} characters</span>
          </div>
          <pre className="prompt glass">{prompt}</pre>
          {previewUrl ? (
            <img className="thumb" src={previewUrl} alt="Reference screenshot of the selected section" />
          ) : (
            <p className="banner bad">The screenshot could not be cropped.</p>
          )}
          <button type="button" className={copied ? "primary done" : "primary"} onClick={() => void handleCopy()}>
            {copied ? "Copied" : "Copy prompt"}
          </button>
          <div className="save-row">
            <button type="button" className="text-button" onClick={() => downloadText(prompt, "pixel2prompt-prompt.md")}>
              Save prompt.md
            </button>
            <button
              type="button"
              className="text-button"
              disabled={!previewUrl}
              onClick={() => {
                if (previewUrl) downloadDataUrl(previewUrl, "pixel2prompt-reference.png")
              }}
            >
              Save reference.png
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="primary" onClick={onGenerate} disabled={busy || generating} aria-busy={generating}>
          {generating ? <span className="spinner" aria-hidden="true" /> : null}
          {generationLabel(generation)}
        </button>
      )}

      {copied ? (
        <p className="banner ok" role="status">
          Prompt copied. Save and attach the reference PNG too.
        </p>
      ) : prompt ? (
        <p className="banner ok" role="status">
          Prompt ready. Copy it and attach the reference PNG.
        </p>
      ) : null}
      {note ? (
        <p className="banner bad" role="status">
          {note}
        </p>
      ) : null}
      {copyError ? <p className="banner bad">{copyError}</p> : null}
    </section>
  )
}

function generationLabel(generation: "idle" | GenerationStage): string {
  if (generation === "analyzing") return "Analyzing section..."
  if (generation === "writing") return "Generating prompt..."
  return "Generate prompt"
}

function sectionLabel(snapshot: SectionSnapshot): string {
  const tag = snapshot.tag.toLowerCase()
  if (snapshot.id) return `${tag}#${snapshot.id}`
  const className = snapshot.className?.trim().split(/\s+/)[0]
  if (className) return `${tag}.${className}`
  return tag
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}
