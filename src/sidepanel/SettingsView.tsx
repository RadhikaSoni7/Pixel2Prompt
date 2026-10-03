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

type Notice = {
  tone: "quiet" | "busy" | "ok" | "bad"
  text: string
}

const hint: Notice = {
  tone: "quiet",
  text: "Jev is optional. An LLM key is required to generate a prompt.",
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [jevApiKey, setJevApiKey] = useState("")
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("gemini")
  const [llmApiKey, setLlmApiKey] = useState("")
  const [notice, setNotice] = useState<Notice>({ tone: "busy", text: "Loading saved keys..." })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!hasStorage()) {
      setNotice(hint)
      return
    }
    let active = true
    void loadSettings()
      .then((settings) => {
        if (!active) return
        setJevApiKey(settings.jevApiKey)
        setLlmProvider(settings.llmProvider)
        setLlmApiKey(settings.llmApiKey)
        setNotice(hint)
      })
      .catch(() => {
        if (active) setNotice({ tone: "bad", text: "Could not read saved keys." })
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSave(): Promise<void> {
    setSaving(true)
    setNotice({ tone: "busy", text: "Saving keys..." })
    try {
      await saveSettings({ jevApiKey, llmProvider, llmApiKey })
      setNotice({ tone: "ok", text: "Saved in this browser." })
    } catch {
      setNotice({ tone: "bad", text: "Could not save these keys." })
    } finally {
      setSaving(false)
    }
  }

  async function handleClear(): Promise<void> {
    setSaving(true)
    setNotice({ tone: "busy", text: "Clearing keys..." })
    try {
      await clearSettings()
      setJevApiKey("")
      setLlmProvider("gemini")
      setLlmApiKey("")
      setNotice({ tone: "ok", text: "Keys cleared from this browser." })
    } catch {
      setNotice({ tone: "bad", text: "Could not clear these keys." })
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
      <p className="lede">Your API keys stay in this browser. Only a section you select is sent.</p>
      <ol className="steps">
        <li>
          Open{" "}
          <a href="https://console.typesafe.ai" target="_blank" rel="noreferrer">
            console.typesafe.ai
          </a>{" "}
          and sign in with Google or an email code.
        </li>
        <li>
          Open{" "}
          <a href="https://console.typesafe.ai/settings/keys" target="_blank" rel="noreferrer">
            API Keys
          </a>
          , create a key, and copy it once. It is shown only at creation.
        </li>
        <li>Paste that key into Jev API Key below and click Save. Leave it blank to generate without Jev.</li>
        <li>
          Create an LLM key too. Gemini:{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Google AI Studio
          </a>
          . OpenAI:{" "}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
            platform.openai.com/api-keys
          </a>
          . Paste it into LLM API Key, choose the provider, and click Save.
        </li>
      </ol>
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
          {saving ? <span className="spinner" aria-hidden="true" /> : null}
          Save
        </button>
        <button type="button" className="ghost" onClick={() => void handleClear()} disabled={saving}>
          Clear
        </button>
      </div>
      <p className={`banner ${notice.tone}`} role="status">
        {notice.text}
      </p>
    </section>
  )
}

function hasStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local)
}
