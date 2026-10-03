import {
  isAdjustSelectionRequest,
  isPingRequest,
  isStartSelectionRequest,
  isStopSelectionRequest,
  type AckResponse,
  type AdjustSelectionResponse,
  type PongResponse,
} from "../types/messages"
import { createSelection } from "./selection.ts"

const READY_FLAG = "data-pixel2prompt"
const READY_VERSION = "2"

const selection = createSelection(() => {
  void chrome.runtime.sendMessage({ type: "SELECTION_CANCELLED" })
})

function main(): void {
  const root = document.documentElement
  if (root.getAttribute(READY_FLAG) === READY_VERSION) return
  root.setAttribute(READY_FLAG, READY_VERSION)

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isPingRequest(message)) {
      const response: PongResponse = { type: "PONG" }
      sendResponse(response)
      return true
    }

    if (isStartSelectionRequest(message)) {
      selection.start()
      const response: AckResponse = { ok: true }
      sendResponse(response)
      return true
    }

    if (isStopSelectionRequest(message)) {
      selection.stop()
      const response: AckResponse = { ok: true }
      sendResponse(response)
      return true
    }

    if (isAdjustSelectionRequest(message)) {
      void selection
        .adjust(message.direction)
        .then((prepared) => {
          const response: AdjustSelectionResponse = { ok: true, ...prepared }
          sendResponse(response)
        })
        .catch((error: unknown) => {
          const response: AdjustSelectionResponse = {
            ok: false,
            error: error instanceof Error ? error.message : "Could not adjust the section.",
          }
          sendResponse(response)
        })
      return true
    }

    return false
  })
}

main()
