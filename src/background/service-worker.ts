import { deliverProviderFetch, isProviderFetchMessage } from "../ai/extension-fetch.ts"
import contentScript from "../content/content-script.ts?script"
import { rememberInvokedTab } from "../storage/invoked-tab.ts"
import {
  isCaptureTabRequest,
  isEnsureContentRequest,
  type CaptureTabResponse,
  type EnsureContentResponse,
} from "../types/messages"

// Opening the panel with setPanelBehavior does not grant activeTab, so scripting the page fails.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {
  // The next service-worker start retries this.
})

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined || tab.windowId === undefined) return
  const tabId = tab.id
  const windowId = tab.windowId
  void chrome.sidePanel.open({ tabId })
  void rememberInvokedTab({ id: tabId, windowId })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isEnsureContentRequest(message)) {
    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        files: [contentScript],
      })
      .then(() => {
        const response: EnsureContentResponse = { ok: true }
        sendResponse(response)
      })
      .catch((error: unknown) => {
        const response: EnsureContentResponse = {
          ok: false,
          error: error instanceof Error ? error.message : "Could not reach this page.",
        }
        sendResponse(response)
      })
    return true
  }

  if (isProviderFetchMessage(message)) {
    void deliverProviderFetch(message)
      .then((response) => sendResponse(response))
      .catch(() => sendResponse({ delivered: false, error: "The provider could not be reached." }))
    return true
  }

  if (isCaptureTabRequest(message)) {
    chrome.tabs
      .captureVisibleTab(message.windowId, { format: "png" })
      .then((dataUrl) => {
        const response: CaptureTabResponse = { ok: true, dataUrl }
        sendResponse(response)
      })
      .catch((error: unknown) => {
        const response: CaptureTabResponse = {
          ok: false,
          error: error instanceof Error ? error.message : "Could not capture the page.",
        }
        sendResponse(response)
      })
    return true
  }

  return false
})
