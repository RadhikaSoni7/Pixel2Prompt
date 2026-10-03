export type SectionCandidate = {
  tag: string
  width: number
  height: number
  areaRatio: number
}

const ATOMS = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "LABEL",
  "SPAN",
  "STRONG",
  "EM",
  "B",
  "I",
  "SMALL",
  "IMG",
  "SVG",
  "PATH",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "CODE",
  "LI",
])

const MIN_WIDTH = 48
const MIN_HEIGHT = 18
const PAGE_RATIO = 0.85

export function chooseSection(chain: readonly SectionCandidate[]): number {
  let fallback = -1

  for (let index = 0; index < chain.length; index += 1) {
    const item = chain[index]
    if (!item || item.width < MIN_WIDTH || item.height < MIN_HEIGHT) continue

    if (item.areaRatio > PAGE_RATIO) break

    if (isSkippableAtom(item)) {
      fallback = index
      continue
    }

    return index
  }

  return fallback
}

function isSkippableAtom(item: SectionCandidate): boolean {
  if (!ATOMS.has(item.tag)) return false
  if ((item.tag === "A" || item.tag === "BUTTON") && item.width >= 160 && item.height >= 64) {
    return false
  }
  return true
}
