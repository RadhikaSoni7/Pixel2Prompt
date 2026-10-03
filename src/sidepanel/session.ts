import type { CaptureFrame, SectionSnapshot } from "../analyzer/snapshot.ts"
import { readInvokedTab } from "../storage/invoked-tab.ts"
import {
  isAdjustSelectionResponse,
  isCaptureTabResponse,
  isEnsureContentResponse,
  isPongResponse,
} from "../types/messages"

export type ActiveTab = {
  id: number
  windowId: number
}

export type SessionFailure =
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

export async function armSelection(): Promise<{ ok: true; tab: ActiveTab } | ({ ok: false } & SessionFailure)> {
  if (!hasChromeApis()) {
    return { ok: false, status: "error", message: "Open this panel from the Pixel2Prompt toolbar icon." }
  }

  let tab: chrome.tabs.Tab | undefined
  try {
    tab = await invokedTab()
    if (!tab) {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      tab = tabs[0]
    }
  } catch (error) {
    return { ok: false, status: "error", message: errorText(error) }
  }

  if (!tab?.id || tab.windowId === undefined) {
    return { ok: false, status: "error", message: "Could not find the active tab." }
  }
  if (tab.url && isRestrictedUrl(tab.url)) {
    return { ok: false, status: "restricted" }
  }

  let injected: unknown
  try {
    injected = await send({
      type: "ENSURE_CONTENT",
      tabId: tab.id,
    })
  } catch (error) {
    return { ok: false, status: "error", message: errorText(error) }
  }
  if (!isEnsureContentResponse(injected)) {
    return { ok: false, status: "error", message: "Could not reach this page." }
  }
  if (!injected.ok) {
    return { ok: false, status: "error", message: presentError(injected.error) }
  }

  try {
    await waitForContentScript(tab.id)
    await chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" })
  } catch (error) {
    return { ok: false, status: "error", message: errorText(error) }
  }

  return { ok: true, tab: { id: tab.id, windowId: tab.windowId } }
}

export async function stopSelection(tabId: number): Promise<void> {
  await chrome.tabs.sendMessage(tabId, { type: "STOP_SELECTION" })
}

export async function adjustSelection(
  tabId: number,
  direction: "parent" | "smaller",
): Promise<{ snapshot: SectionSnapshot; frame: CaptureFrame }> {
  const response: unknown = await chrome.tabs.sendMessage(tabId, {
    type: "ADJUST_SELECTION",
    direction,
  })
  if (!isAdjustSelectionResponse(response)) {
    throw new Error("The page did not return a section.")
  }
  if (!response.ok) throw new Error(response.error)
  return { snapshot: response.snapshot, frame: response.frame }
}

export async function captureTabImage(windowId: number): Promise<string> {
  const response = await send<unknown>({ type: "CAPTURE_TAB", windowId })
  if (!isCaptureTabResponse(response)) {
    throw new Error("Could not capture the page.")
  }
  if (!response.ok) throw new Error(presentError(response.error))
  return response.dataUrl
}

async function invokedTab(): Promise<chrome.tabs.Tab | undefined> {
  const saved = await readInvokedTab()
  if (!saved) return undefined
  try {
    return await chrome.tabs.get(saved.id)
  } catch {
    return undefined
  }
}

function hasChromeApis(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.tabs && chrome.runtime)
}

async function send<T>(message: unknown): Promise<T> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T
  } catch (error) {
    throw new Error(errorText(error))
  }
}

async function waitForContentScript(tabId: number): Promise<void> {
  let last = "The page did not respond."
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const pong: unknown = await chrome.tabs.sendMessage(tabId, { type: "PING" })
      if (isPongResponse(pong)) return
    } catch (error) {
      if (error instanceof Error && error.message.trim()) last = error.message
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(presentError(last))
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return presentError(error.message)
  return "Something went wrong while connecting to the page."
}

function presentError(message: string): string {
  if (/cannot access|permission|activeTab/i.test(message)) {
    return "Click the Pixel2Prompt icon on this tab, then select a section."
  }
  if (/receiving end does not exist/i.test(message)) {
    return "Refresh this tab, then select a section again."
  }
  return message
}
