import { readUsefulStyle } from "./styles.ts"

export type SnapshotNode = {
  tag: string
  text?: string
  children?: SnapshotNode[]
}

export type SectionSnapshot = {
  tag: string
  id: string | null
  className: string | null
  role: string | null
  width: number
  height: number
  elementCount: number
  imageCount: number
  svgCount: number
  text: string
  style: Record<string, string>
  children: SnapshotNode[]
}

export type CaptureFrame = {
  x: number
  y: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META"])
const MAX_DEPTH = 3
const MAX_CHILDREN = 6
const MAX_TEXT = 160
const MAX_ELEMENTS = 400

export function createSnapshot(element: Element): SectionSnapshot {
  const rect = element.getBoundingClientRect()
  const counts = countContents(element)
  const children = compactChildren(element, 0)

  return {
    tag: element.tagName.toLowerCase(),
    id: compactId(element),
    className: compactClass(element),
    role: element.getAttribute("role"),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    elementCount: counts.elements,
    imageCount: counts.images,
    svgCount: counts.svgs,
    text: readText(element),
    style: readUsefulStyle(getComputedStyle(element)),
    children,
  }
}

export function visibleFrame(element: Element): CaptureFrame | null {
  const rect = element.getBoundingClientRect()
  const x = clamp(rect.left, 0, window.innerWidth)
  const y = clamp(rect.top, 0, window.innerHeight)
  const right = clamp(rect.right, 0, window.innerWidth)
  const bottom = clamp(rect.bottom, 0, window.innerHeight)
  const width = right - x
  const height = bottom - y
  if (width < 2 || height < 2) return null

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }
}

export function isClipped(snapshot: SectionSnapshot, frame: CaptureFrame): boolean {
  return frame.width + 4 < snapshot.width || frame.height + 4 < snapshot.height
}

function compactChildren(element: Element, depth: number): SnapshotNode[] {
  if (depth >= MAX_DEPTH || element.tagName === "SVG") return []
  const nodes: SnapshotNode[] = []

  for (const child of element.children) {
    if (nodes.length >= MAX_CHILDREN) break
    if (SKIP_TAGS.has(child.tagName)) continue
    const rect = child.getBoundingClientRect()
    if (rect.width < 1 && rect.height < 1) continue

    const node: SnapshotNode = { tag: child.tagName.toLowerCase() }
    const text = directText(child)
    if (text) node.text = text.slice(0, 80)
    const nested = compactChildren(child, depth + 1)
    if (nested.length > 0) node.children = nested
    nodes.push(node)
  }

  return nodes
}

function countContents(root: Element): { elements: number; images: number; svgs: number } {
  let elements = 1
  let images = root.tagName === "IMG" ? 1 : 0
  let svgs = root.tagName === "SVG" ? 1 : 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let current = walker.nextNode()

  while (current instanceof Element) {
    elements += 1
    if (current.tagName === "IMG") images += 1
    if (current.tagName === "SVG") svgs += 1
    if (elements >= MAX_ELEMENTS) break
    current = walker.nextNode()
  }

  return { elements, images, svgs }
}

function readText(element: Element): string {
  const raw = element instanceof HTMLElement ? element.innerText : element.textContent ?? ""
  const value = raw.replace(/\s+/g, " ").trim()
  if (value.length <= MAX_TEXT) return value
  return `${value.slice(0, MAX_TEXT - 1)}…`
}

function directText(element: Element): string {
  let text = ""
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? ""
  }
  return text.replace(/\s+/g, " ").trim()
}

function compactId(element: Element): string | null {
  const id = element.id.trim()
  if (!id || id.length > 80) return null
  return id
}

function compactClass(element: Element): string | null {
  const value = element.getAttribute("class")
  if (!value) return null
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && token.length <= 40)
    .slice(0, 4)
  return tokens.length > 0 ? tokens.join(" ") : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
