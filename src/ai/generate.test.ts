import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import type { SectionSnapshot } from "../analyzer/snapshot.ts"
import { buildInstructions, generateReconstructionPrompt } from "./generate.ts"
import { createSingleFlight } from "./single-flight.ts"
import type { AiSettings } from "../storage/settings.ts"

const snapshot: SectionSnapshot = {
  tag: "article",
  id: "card",
  className: "card",
  role: null,
  width: 320,
  height: 180,
  elementCount: 3,
  imageCount: 0,
  svgCount: 0,
  text: "Beta card",
  style: { display: "flex" },
  children: [{ tag: "h2", text: "Beta" }],
}

const secret = "secret-key-value"

function settings(overrides: Partial<AiSettings> = {}): AiSettings {
  return {
    jevApiKey: "",
    llmProvider: "gemini",
    llmApiKey: secret,
    ...overrides,
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("generateReconstructionPrompt", () => {
  it("does not call the network when the LLM key is missing", async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async () => {
      calls += 1
      return jsonResponse(200, {})
    }
    await assert.rejects(
      () =>
        generateReconstructionPrompt({
          snapshot,
          stack: "react",
          settings: settings({ llmApiKey: "  " }),
          fetchImpl,
        }),
      /Add an LLM API key/,
    )
    assert.equal(calls, 0)
  })

  it("skips Jev and calls the LLM once when only the LLM key is saved", async () => {
    const calls: string[] = []
    const fetchImpl: typeof fetch = async (input) => {
      calls.push(String(input))
      return jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: "Rebuild the card." }] } }],
      })
    }
    const result = await generateReconstructionPrompt({
      snapshot,
      stack: "tailwind",
      settings: settings(),
      fetchImpl,
    })
    assert.equal(calls.length, 1)
    assert.match(calls[0] ?? "", /generativelanguage\.googleapis\.com/)
    assert.equal(result.jevUsed, false)
    assert.equal(result.prompt, "Rebuild the card.")
  })

  it("makes one Jev request and then one LLM request", async () => {
    const calls: string[] = []
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input)
      calls.push(url)
      const headers = new Headers(init?.headers)
      assert.equal(headers.get("Authorization")?.includes(secret) || headers.get("x-goog-api-key") === secret, true)
      assert.equal(url.includes(secret), false)
      if (url.includes("typesafe")) {
        return jsonResponse(200, {
          answers: {
            component: { choice: "card" },
            layout: { choice: "stack" },
            density: { score: 1, legend: ["Sparse", "Moderate", "Dense"] },
            interactive: { noul: 0.2 },
          },
        })
      }
      const body = JSON.parse(String(init?.body))
      const instructions = body.contents[0].parts[0].text as string
      assert.match(instructions, /Tailwind/)
      assert.equal(instructions.includes("data:image"), false)
      assert.match(instructions, /component: card/)
      return jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: "Prompt ready." }] } }],
      })
    }
    const result = await generateReconstructionPrompt({
      snapshot,
      stack: "tailwind",
      settings: settings({ jevApiKey: secret }),
      fetchImpl,
    })
    assert.deepEqual(
      calls.map((url) => url.includes("typesafe")),
      [true, false],
    )
    assert.equal(result.jevUsed, true)
    assert.equal(result.prompt, "Prompt ready.")
  })

  it("stops after an invalid Jev key and does not call the LLM", async () => {
    const calls: string[] = []
    const fetchImpl: typeof fetch = async (input) => {
      calls.push(String(input))
      return jsonResponse(401, { error: `bad ${secret}` })
    }
    await assert.rejects(
      () =>
        generateReconstructionPrompt({
          snapshot,
          stack: "react",
          settings: settings({ jevApiKey: secret, llmProvider: "openai" }),
          fetchImpl,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /Jev rejected/)
        assert.equal(error.message.includes(secret), false)
        return true
      },
    )
    assert.equal(calls.length, 1)
    assert.match(calls[0] ?? "", /typesafe/)
  })

  it("retries Gemini once when the API names a replacement model", async () => {
    const calls: string[] = []
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input)
      calls.push(url)
      if (url.includes("gemini-3.5-flash-lite")) {
        return jsonResponse(404, {
          error: {
            message:
              "models/gemini-3.5-flash-lite is no longer available. Please update your code to use models/gemini-3.8-flash.",
          },
        })
      }
      return jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: "Recovered prompt." }] } }],
      })
    }
    const result = await generateReconstructionPrompt({
      snapshot,
      stack: "flutter",
      settings: settings(),
      fetchImpl,
    })
    assert.deepEqual(
      calls.map((url) => url.includes("gemini-3.8-flash")),
      [false, true],
    )
    assert.equal(result.prompt, "Recovered prompt.")
  })

  it("explains a model failure without revealing the key", async () => {
    const fetchImpl: typeof fetch = async () =>
      jsonResponse(404, { error: { message: `model missing for ${secret}` } })
    await assert.rejects(
      () =>
        generateReconstructionPrompt({
          snapshot,
          stack: "android",
          settings: settings(),
          fetchImpl,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /could not write a prompt/i)
        assert.match(error.message, /model missing for \[key\]/)
        assert.equal(error.message.includes(secret), false)
        return true
      },
    )
  })

  it("reports an invalid LLM key without revealing it", async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse(400, { error: { message: `API key ${secret} is invalid` } })
    await assert.rejects(
      () =>
        generateReconstructionPrompt({
          snapshot,
          stack: "html",
          settings: settings({ llmProvider: "openai" }),
          fetchImpl,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /LLM provider rejected/)
        assert.equal(error.message.includes(secret), false)
        return true
      },
    )
  })

  it("keeps hover and selection code off the AI endpoints", () => {
    const sources = [
      "src/content/selection.ts",
      "src/content/content-script.ts",
      "src/content/pick-section.ts",
      "src/analyzer/snapshot.ts",
    ]
    for (const file of sources) {
      const text = readFileSync(file, "utf8")
      assert.equal(text.includes("api.typesafe.ai"), false, file)
      assert.equal(text.includes("generativelanguage"), false, file)
      assert.equal(text.includes("api.openai.com"), false, file)
    }
  })
})

describe("buildInstructions", () => {
  it("does not embed a screenshot", () => {
    const text = buildInstructions(snapshot, "existing", null)
    assert.equal(text.includes("data:image"), false)
    assert.match(text, /existing project stack/i)
    assert.match(text, /"tag":"article"/)
  })

  it("asks for Flutter and Android when those stacks are selected", () => {
    assert.match(buildInstructions(snapshot, "flutter", null), /Flutter widget/)
    assert.match(buildInstructions(snapshot, "android", null), /Jetpack Compose/)
  })
})

describe("createSingleFlight", () => {
  it("runs only one task while a generation is in flight", async () => {
    const run = createSingleFlight()
    let started = 0
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const first = run(async () => {
      started += 1
      await gate
      return "first"
    })
    const second = await run(async () => {
      started += 1
      return "second"
    })
    release()
    assert.equal(await first, "first")
    assert.equal(second, undefined)
    assert.equal(started, 1)
  })
})
