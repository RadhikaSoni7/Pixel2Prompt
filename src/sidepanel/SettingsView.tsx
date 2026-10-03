type SettingsViewProps = {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
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
      <fieldset disabled>
        <label>
          Jev API Key
          <input type="password" autoComplete="off" spellCheck={false} value="" readOnly />
        </label>
        <label>
          LLM Provider
          <select defaultValue="gemini">
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        <label>
          LLM API Key
          <input type="password" autoComplete="off" spellCheck={false} value="" readOnly />
        </label>
        <div className="button-row">
          <button type="button" className="primary">
            Save
          </button>
          <button type="button" className="ghost">
            Clear
          </button>
        </div>
      </fieldset>
      <p className="note">AI requests are not enabled in this build.</p>
    </section>
  )
}
