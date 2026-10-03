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
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}
