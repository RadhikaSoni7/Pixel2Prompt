export type LlmProvider = "gemini" | "openai"

export type AiSettings = {
  jevApiKey: string
  llmProvider: LlmProvider
  llmApiKey: string
}

const STORAGE_KEY = "pixel2prompt-settings"

export const EMPTY_SETTINGS: AiSettings = {
  jevApiKey: "",
  llmProvider: "gemini",
  llmApiKey: "",
}

export async function loadSettings(): Promise<AiSettings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return normalizeSettings(stored[STORAGE_KEY])
}

export async function saveSettings(settings: AiSettings): Promise<void> {
  const next = normalizeSettings(settings)
  await chrome.storage.local.set({ [STORAGE_KEY]: next })
}

export async function clearSettings(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}

export function normalizeSettings(value: unknown): AiSettings {
  if (!isRecord(value)) return { ...EMPTY_SETTINGS }
  return {
    jevApiKey: typeof value.jevApiKey === "string" ? value.jevApiKey.trim() : "",
    llmProvider: value.llmProvider === "openai" ? "openai" : "gemini",
    llmApiKey: typeof value.llmApiKey === "string" ? value.llmApiKey.trim() : "",
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
