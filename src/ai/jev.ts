import type { SectionSnapshot } from "../analyzer/snapshot.ts"
import { PromptError, readFailure } from "./errors.ts"

const ENDPOINT = "https://api.typesafe.ai/v1/systemone"

export type JevAnalysis = {
  component: string | null
  layout: string | null
  density: string | null
  interactive: boolean | null
}

export async function analyzeWithJev(
  snapshot: SectionSnapshot,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<JevAnalysis> {
  const key = apiKey.trim()
  let response: Response
  try {
    response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jev-latest",
        state: snapshot,
        questions: JEV_QUESTIONS,
      }),
      signal: AbortSignal.timeout(25_000),
    })
  } catch {
    throw new PromptError("Jev could not be reached. The model was not called.")
  }

  if (!response.ok) {
    const failure = await readFailure(response, key)
    if (failure === "invalid-key") {
      throw new PromptError("Jev rejected the API key. Check Settings and try again.")
    }
    throw new PromptError("Jev could not analyze this section. The model was not called.")
  }

  return parseJev(await response.json())
}

const JEV_QUESTIONS = {
  component: {
    type: "choice",
    instructions: "What kind of UI section is this?",
    criteria: {
      card: "A self-contained card or tile",
      hero: "A large introductory banner",
      nav: "Navigation or a menu",
      form: "A form or input group",
      list: "A repeated list or feed",
      pricing: "Pricing or a plan comparison",
      other: "None of the listed kinds",
    },
  },
  layout: {
    type: "choice",
    instructions: "How are the visible parts arranged?",
    criteria: {
      stack: "Items stacked vertically",
      row: "Items in a horizontal row",
      grid: "Items in a grid",
      split: "Two main regions side by side",
    },
  },
  density: {
    type: "score",
    instructions: "How dense is the visible content?",
    criteria: ["Sparse, lots of space", "Moderate", "Dense, many details"],
  },
  interactive: {
    type: "noul",
    instructions: "Does the section contain a control a person operates, such as a button, link, or field?",
    criteria: {
      true: "A person can click, type, or choose something",
      false: "It is static content",
    },
  },
}

function parseJev(value: unknown): JevAnalysis {
  const answers = isRecord(value) && isRecord(value.answers) ? value.answers : {}
  return {
    component: readChoice(answers.component),
    layout: readChoice(answers.layout),
    density: readScore(answers.density),
    interactive: readNoul(answers.interactive),
  }
}

function readChoice(value: unknown): string | null {
  if (!isRecord(value) || typeof value.choice !== "string") return null
  return value.choice
}

function readScore(value: unknown): string | null {
  if (!isRecord(value) || typeof value.score !== "number" || !Array.isArray(value.legend)) return null
  const label = value.legend[value.score]
  return typeof label === "string" ? label : null
}

function readNoul(value: unknown): boolean | null {
  if (!isRecord(value) || typeof value.noul !== "number") return null
  return value.noul >= 0.5
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
