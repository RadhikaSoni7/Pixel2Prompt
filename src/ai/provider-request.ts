const ALLOWED_PREFIXES = [
  "https://api.typesafe.ai/",
  "https://generativelanguage.googleapis.com/",
  "https://api.openai.com/",
]

const ALLOWED_HEADERS = new Set(["content-type", "authorization", "x-goog-api-key"])

export type ProviderRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
}

export function isProviderRequest(value: unknown): value is ProviderRequest {
  if (!isRecord(value)) return false
  return (
    typeof value.url === "string" &&
    typeof value.method === "string" &&
    typeof value.body !== "number" &&
    (value.body === null || typeof value.body === "string") &&
    isStringRecord(value.headers)
  )
}

export async function runProviderRequest(
  request: ProviderRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; body: string }> {
  if (request.method !== "POST" || !allowedProviderUrl(request.url)) {
    throw new Error("That provider address is not allowed.")
  }

  const response = await fetchImpl(request.url, {
    method: "POST",
    headers: safeHeaders(request.headers),
    body: request.body,
    signal: AbortSignal.timeout(45_000),
  })
  return { status: response.status, body: await response.text() }
}

export function allowedProviderUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false
    return ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))
  } catch {
    return false
  }
}

function safeHeaders(headers: Record<string, string>): Record<string, string> {
  const safe: Record<string, string> = {}
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value !== "string") continue
    if (ALLOWED_HEADERS.has(name.toLowerCase())) safe[name] = value
  }
  return safe
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false
  return Object.values(value).every((item) => typeof item === "string")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
