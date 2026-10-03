export class PromptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PromptError"
  }
}

export type ProviderFailure = {
  kind: "invalid-key" | "quota" | "other"
  detail: string
}

export function redactKey(message: string, key: string): string {
  const trimmed = key.trim()
  if (!trimmed) return message
  return message.split(trimmed).join("[key]")
}

export async function readFailure(response: Response, key: string): Promise<ProviderFailure> {
  const body = redactKey(await response.text(), key).slice(0, 500)
  const detail = compactDetail(body, response.status)
  if (response.status === 401 || response.status === 403 || /api[_ ]?key|unauthorized|permission denied|API_KEY_INVALID/i.test(body)) {
    return { kind: "invalid-key", detail }
  }
  if (response.status === 429 || /quota|resource exhausted|RESOURCE_EXHAUSTED|billing/i.test(body)) {
    return { kind: "quota", detail }
  }
  return { kind: "other", detail }
}

export function reachabilityError(error: unknown, fallback: string, timeout: string): PromptError {
  if (error instanceof PromptError) return error
  const message = error instanceof Error ? error.message : ""
  if (/reload the pixel2prompt extension/i.test(message)) return new PromptError(message)
  if (error instanceof DOMException && error.name === "TimeoutError") return new PromptError(timeout)
  if (/timeout|timed out/i.test(message)) return new PromptError(timeout)
  return new PromptError(fallback)
}

export function llmFailure(failure: ProviderFailure, fallback: string): PromptError {
  if (failure.kind === "invalid-key") {
    return new PromptError("The LLM provider rejected the API key. Check Settings and try again.")
  }
  if (failure.kind === "quota") {
    return new PromptError("The model is out of quota. Check the provider account and try again.")
  }
  return new PromptError(`${fallback} ${failure.detail}`.trim())
}

function compactDetail(raw: string, status: number): string {
  const message = jsonMessage(raw)
  const text = (message || raw).replace(/\s+/g, " ").trim()
  return text.slice(0, 180) || `HTTP ${status}`
}

function jsonMessage(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw)
    return readMessage(parsed)
  } catch {
    return ""
  }
}

function readMessage(value: unknown): string {
  if (!isRecord(value)) return ""
  if (typeof value.message === "string") return value.message
  if (isRecord(value.error)) return readMessage(value.error)
  return ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
