import {
  isEnsureContentResponse,
  isPongResponse,
} from "../types/messages"

export type PanelStatus =
  | { status: "idle" }
  | { status: "working" }
  | { status: "connected" }
  | { status: "restricted" }
  | { status: "error"; message: string }

const RESTRICTED_PROTOCOL = /^(chrome|chrome-extension|edge|about|devtools|view-source):/i

export function isRestrictedUrl(url: string): boolean {
  if (RESTRICTED_PROTOCOL.test(url)) return true
  try {
    return new URL(url).hostname === "chromewebstore.google.com"
  } catch {
    return true
  }
}

export async function connectActiveTab(): Promise<PanelStatus> {
  if (!hasChromeApis()) {
    return {
      status: "error",
      message: "Open this panel from the Pixel2Prompt toolbar icon.",
    }
  }

  let tab: chrome.tabs.Tab | undefined
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    tab = tabs[0]
  } catch (error) {
    return { status: "error", message: errorText(error) }
  }

  if (!tab?.id) {
    return { status: "error", message: "Could not find the active tab." }
  }
  if (tab.url && isRestrictedUrl(tab.url)) {
    return { status: "restricted" }
  }

  let injected: unknown
  try {
    injected = await chrome.runtime.sendMessage({
      type: "ENSURE_CONTENT",
      tabId: tab.id,
    })
  } catch (error) {
    return { status: "error", message: errorText(error) }
  }

  if (!isEnsureContentResponse(injected)) {
    return { status: "error", message: "Could not reach this page." }
  }
  if (!injected.ok) {
    return { status: "error", message: presentError(injected.error) }
  }

  try {
    const pong: unknown = await chrome.tabs.sendMessage(tab.id, { type: "PING" })
    if (!isPongResponse(pong)) {
      return { status: "error", message: "The page did not respond." }
    }
  } catch (error) {
    return { status: "error", message: errorText(error) }
  }

  return { status: "connected" }
}

function hasChromeApis(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.tabs && chrome.runtime)
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return presentError(error.message)
  return "Something went wrong while connecting to the page."
}

function presentError(message: string): string {
  if (/cannot access|permission|activeTab/i.test(message)) {
    return "Click the Pixel2Prompt icon on this tab, then select a section."
  }
  return message
}
