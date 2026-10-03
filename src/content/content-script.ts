import { isPingRequest, type PongResponse } from "../types/messages"

const READY_FLAG = "data-pixel2prompt"

function main(): void {
  const root = document.documentElement
  if (root.hasAttribute(READY_FLAG)) return
  root.setAttribute(READY_FLAG, "ready")

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isPingRequest(message)) return false
    const response: PongResponse = { type: "PONG" }
    sendResponse(response)
    return true
  })
}

main()
