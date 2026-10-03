import contentScript from "../content/content-script.ts?script"
import {
  isEnsureContentRequest,
  type EnsureContentResponse,
} from "../types/messages"

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
  // The next service-worker start retries this.
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isEnsureContentRequest(message)) return false

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
})
