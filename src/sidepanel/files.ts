export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    document.body.append(area)
    area.select()
    const copied = document.execCommand("copy")
    area.remove()
    if (!copied) throw new Error("Could not copy the prompt.")
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const href = dataUrl.startsWith("data:") ? blobUrlFromData(dataUrl) : dataUrl
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  if (href !== dataUrl) window.setTimeout(() => URL.revokeObjectURL(href), 1500)
}

function blobUrlFromData(dataUrl: string): string {
  const comma = dataUrl.indexOf(",")
  const header = dataUrl.slice(0, Math.max(comma, 0))
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const mime = /data:([^;,]+)/.exec(header)?.[1] ?? "application/octet-stream"
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

export function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }))
  downloadDataUrl(url, filename)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
