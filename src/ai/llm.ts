import type { LlmProvider } from "../storage/settings.ts"
import { PromptError, readFailure } from "./errors.ts"

const GEMINI_MODEL = "gemini-2.5-flash"
const OPENAI_MODEL = "gpt-4o-mini"

export async function writePrompt(
  provider: LlmProvider,
  apiKey: string,
  instructions: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const key = apiKey.trim()
  return provider === "openai"
    ? writeOpenAi(key, instructions, fetchImpl)
    : writeGemini(key, instructions, fetchImpl)
}

async function writeGemini(key: string, instructions: string, fetchImpl: typeof fetch): Promise<string> {
  const response = await request(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instructions }] }],
        generationConfig: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(45_000),
    },
    key,
    fetchImpl,
  )
  const text = geminiText(await response.json())
  if (!text) throw new PromptError("The model returned an empty prompt.")
  return text
}

async function writeOpenAi(key: string, instructions: string, fetchImpl: typeof fetch): Promise<string> {
  const response = await request(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [{ role: "user", content: instructions }],
      }),
      signal: AbortSignal.timeout(45_000),
    },
    key,
    fetchImpl,
  )
  const text = openAiText(await response.json())
  if (!text) throw new PromptError("The model returned an empty prompt.")
  return text
}

async function request(
  url: string,
  init: RequestInit,
  key: string,
  fetchImpl: typeof fetch,
): Promise<Response> {
  let response: Response
  try {
    response = await fetchImpl(url, init)
  } catch {
    throw new PromptError("The model could not be reached.")
  }
  if (response.ok) return response
  const failure = await readFailure(response, key)
  if (failure === "invalid-key") {
    throw new PromptError("The LLM provider rejected the API key. Check Settings and try again.")
  }
  throw new PromptError("The model could not write a prompt.")
}

function geminiText(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.candidates)) return ""
  const candidate = value.candidates[0]
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    return ""
  }
  return candidate.content.parts
    .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim()
}

function openAiText(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices)) return ""
  const choice = value.choices[0]
  if (!isRecord(choice) || !isRecord(choice.message) || typeof choice.message.content !== "string") {
    return ""
  }
  return choice.message.content.trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
