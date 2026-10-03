import type { CaptureFrame } from "../analyzer/snapshot.ts"

export async function cropScreenshot(dataUrl: string, frame: CaptureFrame): Promise<string> {
  const image = await loadImage(dataUrl)
  const scaleX = image.naturalWidth / Math.max(1, frame.viewportWidth)
  const scaleY = image.naturalHeight / Math.max(1, frame.viewportHeight)
  const sx = clamp(Math.round(frame.x * scaleX), 0, Math.max(0, image.naturalWidth - 1))
  const sy = clamp(Math.round(frame.y * scaleY), 0, Math.max(0, image.naturalHeight - 1))
  const sw = clamp(Math.round(frame.width * scaleX), 1, image.naturalWidth - sx)
  const sh = clamp(Math.round(frame.height * scaleY), 1, image.naturalHeight - sy)

  const canvas = document.createElement("canvas")
  canvas.width = sw
  canvas.height = sh
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not crop the screenshot.")
  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas.toDataURL("image/png")
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not read the screenshot."))
    image.src = src
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
