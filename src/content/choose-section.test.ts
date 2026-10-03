import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { chooseSection, type SectionCandidate } from "./choose-section.ts"

function candidate(
  tag: string,
  width: number,
  height: number,
  areaRatio = 0.1,
): SectionCandidate {
  return { tag, width, height, areaRatio }
}

describe("chooseSection", () => {
  it("climbs past text and selects the card", () => {
    const index = chooseSection([
      candidate("SPAN", 40, 16, 0.01),
      candidate("H2", 240, 32, 0.02),
      candidate("DIV", 320, 180, 0.08),
      candidate("MAIN", 1200, 2000, 0.94),
    ])
    assert.equal(index, 2)
  })

  it("keeps a large link card", () => {
    const index = chooseSection([
      candidate("SPAN", 80, 20, 0.01),
      candidate("A", 300, 200, 0.12),
      candidate("DIV", 1100, 800, 0.7),
    ])
    assert.equal(index, 1)
  })

  it("falls back to the paragraph when the parent is the page", () => {
    const index = chooseSection([
      candidate("SPAN", 30, 14, 0.01),
      candidate("P", 640, 96, 0.06),
      candidate("DIV", 1400, 2400, 0.96),
    ])
    assert.equal(index, 1)
  })

  it("does not select the whole page", () => {
    const index = chooseSection([
      candidate("SPAN", 20, 12, 0.001),
      candidate("DIV", 1400, 2400, 0.96),
    ])
    assert.equal(index, -1)
  })

  it("returns -1 when nothing is large enough", () => {
    const index = chooseSection([
      candidate("SPAN", 20, 10, 0.001),
      candidate("I", 16, 16, 0.001),
    ])
    assert.equal(index, -1)
  })
})
