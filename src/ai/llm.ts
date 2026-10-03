import type { LlmProvider } from "../storage/settings.ts"
import { llmFailure, PromptError, reachabilityError, readFailure } from "./errors.ts"

const GEMINI_MODEL = "gemini-3.5-flash-lite"
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
  return completeGemini(GEMINI_MODEL, key, instructions, fetchImpl, true)
}

async function completeGemini(
  model: string,
  key: string,
  instructions: string,
  fetchImpl: typeof fetch,
  allowRetry: boolean,
): Promise<string> {
  const response = await request(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
    },
    fetchImpl,
  )
  if (response.ok) return requireText(geminiText(await response.json()))

  const failure = await readFailure(response, key)
  const suggested = allowRetry ? suggestedGeminiModel(failure.detail, model) : null
  if (suggested) return completeGemini(suggested, key, instructions, fetchImpl, false)
  throw llmFailure(failure, "The model could not write a prompt.")
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
    },
    fetchImpl,
  )
  if (response.ok) return requireText(openAiText(await response.json()))
  throw llmFailure(await readFailure(response, key), "The model could not write a prompt.")
}

async function request(url: string, init: RequestInit, fetchImpl: typeof fetch): Promise<Response> {
  try {
    return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(45_000) })
  } catch (error) {
    throw reachabilityError(error, "The model could not be reached.", "The model timed out. Try again.")
  }
}

function requireText(text: string): string {
  if (!text) throw new PromptError("The model returned an empty prompt.")
  return text
}

export function suggestedGeminiModel(detail: string, current: string): string | null {
  const found = [...detail.matchAll(/models\/([a-z0-9][a-z0-9._-]{0,63})/gi)].map((match) => match[1] ?? "")
  const next = found.find((id) => id.toLowerCase() !== current.toLowerCase())
  return next || null
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
