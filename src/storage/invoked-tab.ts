const STORAGE_KEY = "pixel2prompt-invoked-tab"

type InvokedTab = {
  id: number
  windowId: number
}

export async function rememberInvokedTab(tab: InvokedTab): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEY]: tab })
}

export async function readInvokedTab(): Promise<InvokedTab | null> {
  const stored = await chrome.storage.session.get(STORAGE_KEY)
  const value = stored[STORAGE_KEY]
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.windowId !== "number") return null
  return { id: value.id, windowId: value.windowId }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
