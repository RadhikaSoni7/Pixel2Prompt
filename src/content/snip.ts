export type SnipBox = {
  x: number
  y: number
  width: number
  height: number
}

const MIN_SIZE = 12

export function snipBox(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  viewportWidth: number,
  viewportHeight: number,
  minSize = MIN_SIZE,
): SnipBox | null {
  const left = clamp(Math.min(startX, endX), 0, viewportWidth)
  const top = clamp(Math.min(startY, endY), 0, viewportHeight)
  const right = clamp(Math.max(startX, endX), 0, viewportWidth)
  const bottom = clamp(Math.max(startY, endY), 0, viewportHeight)
  const width = Math.round(right - left)
  const height = Math.round(bottom - top)
  if (width < minSize || height < minSize) return null

  return {
    x: Math.round(left),
    y: Math.round(top),
    width,
    height,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
