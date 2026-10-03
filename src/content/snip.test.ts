import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { snipBox } from "./snip.ts"

describe("snipBox", () => {
  it("returns the dragged rectangle", () => {
    assert.deepEqual(snipBox(40, 50, 240, 180, 1200, 800), {
      x: 40,
      y: 50,
      width: 200,
      height: 130,
    })
  })

  it("accepts a drag that moves up and left", () => {
    assert.deepEqual(snipBox(300, 220, 80, 40, 1200, 800), {
      x: 80,
      y: 40,
      width: 220,
      height: 180,
    })
  })

  it("clips the rectangle to the viewport", () => {
    assert.deepEqual(snipBox(-20, -10, 100, 80, 1200, 800), {
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    })
  })

  it("ignores a click that is too small to snip", () => {
    assert.equal(snipBox(20, 20, 24, 40, 1200, 800), null)
  })
})
