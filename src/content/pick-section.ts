import { chooseSection, type SectionCandidate } from "./choose-section.ts"

const HOST_ID = "pixel2prompt-highlight"

export function pickSection(x: number, y: number): Element | null {
  const hit = document.elementFromPoint(x, y)
  if (!hit || hit === document.body || hit === document.documentElement) return null

  const chain: SectionCandidate[] = []
  const elements: Element[] = []
  const viewportArea = Math.max(1, window.innerWidth * window.innerHeight)
  let current: Element | null = hit

  while (current && current !== document.body && current !== document.documentElement) {
    if (current.id !== HOST_ID) {
      const rect = current.getBoundingClientRect()
      chain.push({
        tag: current.tagName,
        width: rect.width,
        height: rect.height,
        areaRatio: (rect.width * rect.height) / viewportArea,
      })
      elements.push(current)
    }
    current = parentOf(current)
  }

  const index = chooseSection(chain)
  return index >= 0 ? elements[index] ?? null : null
}

export function parentSection(element: Element): Element | null {
  const parent = parentOf(element)
  if (!parent || parent === document.body || parent === document.documentElement) return null
  return parent
}

export function smallerSection(element: Element, x: number, y: number): Element | null {
  const children = [...element.children].filter((child) => {
    const rect = child.getBoundingClientRect()
    return rect.width >= 48 && rect.height >= 18
  })

  const hit = children.find((child) => {
    const rect = child.getBoundingClientRect()
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  })
  if (hit && hit !== element) return hit

  const parentArea = area(element)
  const smaller = children
    .filter((child) => area(child) < parentArea * 0.92)
    .sort((left, right) => area(right) - area(left))
  return smaller[0] ?? null
}

function parentOf(element: Element): Element | null {
  if (element.parentElement) return element.parentElement
  const root = element.getRootNode()
  if (root instanceof ShadowRoot) return root.host
  return null
}

function area(element: Element): number {
  const rect = element.getBoundingClientRect()
  return rect.width * rect.height
}
