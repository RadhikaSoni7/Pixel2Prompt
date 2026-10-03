import { isProviderRequest, runProviderRequest, type ProviderRequest } from "./provider-request.ts"

export type ProviderFetchResponse =
  | { delivered: true; status: number; body: string }
  | { delivered: false; error: string }

export function isProviderFetchMessage(value: unknown): value is ProviderRequest & { type: "AI_FETCH" } {
  return isRecord(value) && value.type === "AI_FETCH" && isProviderRequest(value)
}

export function isProviderFetchResponse(value: unknown): value is ProviderFetchResponse {
  if (!isRecord(value)) return false
  if (value.delivered === true) return typeof value.status === "number" && typeof value.body === "string"
  return value.delivered === false && typeof value.error === "string"
}

export async function deliverProviderFetch(
  request: ProviderRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<ProviderFetchResponse> {
  try {
    const result = await runProviderRequest(request, fetchImpl)
    return { delivered: true, status: result.status, body: result.body }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return { delivered: false, error: "The provider timed out." }
    }
    if (/timed out|timeout/i.test(message)) return { delivered: false, error: "The provider timed out." }
    if (/not allowed/i.test(message)) return { delivered: false, error: "That provider address is not allowed." }
    return { delivered: false, error: "The provider could not be reached." }
  }
}

export async function extensionFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (error) {
    if (!canProxy()) throw error
    try {
      return await proxyFetch(input, init)
    } catch {
      throw error
    }
  }
}

function proxyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = requestUrl(input)
  const message = {
    type: "AI_FETCH" as const,
    url,
    method: init?.method ?? "POST",
    headers: headerRecord(init?.headers),
    body: typeof init?.body === "string" ? init.body : null,
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: unknown) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        reject(new Error(proxyError(lastError.message ?? "")))
        return
      }
      if (!isProviderFetchResponse(response)) {
        reject(new Error("The provider did not respond."))
        return
      }
      if (!response.delivered) {
        reject(new Error(response.error))
        return
      }
      resolve(
        new Response(response.body, {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }),
      )
    })
  })
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

function canProxy(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.sendMessage)
}

function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  const record: Record<string, string> = {}
  new Headers(headers).forEach((value, key) => {
    record[key] = value
  })
  return record
}

function proxyError(message: string): string {
  if (/receiving end does not exist/i.test(message)) {
    return "Reload the Pixel2Prompt extension, then try again."
  }
  return message || "The provider could not be reached."
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
