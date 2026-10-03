import { useEffect, useState } from "react"
import {
  clearSettings,
  loadSettings,
  saveSettings,
  type LlmProvider,
} from "../storage/settings.ts"

type SettingsViewProps = {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [jevApiKey, setJevApiKey] = useState("")
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("gemini")
  const [llmApiKey, setLlmApiKey] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void loadSettings().then((settings) => {
      if (!active) return
      setJevApiKey(settings.jevApiKey)
      setLlmProvider(settings.llmProvider)
      setLlmApiKey(settings.llmApiKey)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleSave(): Promise<void> {
    setSaving(true)
    try {
      await saveSettings({ jevApiKey, llmProvider, llmApiKey })
      setStatus("Saved in this browser.")
    } catch {
      setStatus("Could not save these keys.")
    } finally {
      setSaving(false)
    }
  }

  async function handleClear(): Promise<void> {
    setSaving(true)
    try {
      await clearSettings()
      setJevApiKey("")
      setLlmProvider("gemini")
      setLlmApiKey("")
      setStatus("Keys cleared from this browser.")
    } catch {
      setStatus("Could not clear these keys.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="settings" aria-labelledby="settings-title">
      <button type="button" className="back" onClick={onBack}>
        Back
      </button>
      <h2 id="settings-title">Settings</h2>
      <p className="lede">
        Your API keys are stored locally. Pixel2Prompt only processes the section you
        explicitly select.
      </p>
      <label>
        Jev API Key
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={jevApiKey}
          onChange={(event) => setJevApiKey(event.target.value)}
        />
      </label>
      <label>
        LLM Provider
        <select
          value={llmProvider}
          onChange={(event) => setLlmProvider(event.target.value === "openai" ? "openai" : "gemini")}
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
      </label>
      <label>
        LLM API Key
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={llmApiKey}
          onChange={(event) => setLlmApiKey(event.target.value)}
        />
      </label>
      <div className="button-row">
        <button type="button" className="primary" onClick={() => void handleSave()} disabled={saving}>
          Save
        </button>
        <button type="button" className="ghost" onClick={() => void handleClear()} disabled={saving}>
          Clear
        </button>
      </div>
      <p className="note" role="status">
        {status ?? "Jev is optional. An LLM key is required to generate a prompt."}
      </p>
    </section>
  )
}
