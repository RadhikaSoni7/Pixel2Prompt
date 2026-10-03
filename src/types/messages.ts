export type EnsureContentRequest = {
  type: "ENSURE_CONTENT"
  tabId: number
}

export type PingRequest = {
  type: "PING"
}

export type PongResponse = {
  type: "PONG"
}

export type EnsureContentResponse =
  | { ok: true }
  | { ok: false; error: string }

export function isEnsureContentRequest(
  value: unknown,
): value is EnsureContentRequest {
  if (!isRecord(value)) return false
  return value.type === "ENSURE_CONTENT" && typeof value.tabId === "number"
}

export function isPingRequest(value: unknown): value is PingRequest {
  if (!isRecord(value)) return false
  return value.type === "PING"
}

export function isPongResponse(value: unknown): value is PongResponse {
  if (!isRecord(value)) return false
  return value.type === "PONG"
}

export function isEnsureContentResponse(
  value: unknown,
): value is EnsureContentResponse {
  if (!isRecord(value)) return false
  if (value.ok === true) return true
  return value.ok === false && typeof value.error === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
