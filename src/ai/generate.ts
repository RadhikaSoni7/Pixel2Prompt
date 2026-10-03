import type { SectionSnapshot } from "../analyzer/snapshot.ts"
import type { AiSettings } from "../storage/settings.ts"
import { PromptError } from "./errors.ts"
import { analyzeWithJev, type JevAnalysis } from "./jev.ts"
import { writePrompt } from "./llm.ts"
import { stackInstruction, type StackId } from "./stacks.ts"

export type GenerationStage = "analyzing" | "writing"

export type GenerationResult = {
  prompt: string
  jevUsed: boolean
}

type GenerateInput = {
  snapshot: SectionSnapshot
  stack: StackId
  settings: AiSettings
  fetchImpl?: typeof fetch
  onStage?: (stage: GenerationStage) => void
}

export async function generateReconstructionPrompt(input: GenerateInput): Promise<GenerationResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  const llmKey = input.settings.llmApiKey.trim()
  const jevKey = input.settings.jevApiKey.trim()

  if (!llmKey) {
    throw new PromptError("Add an LLM API key in Settings before generating a prompt.")
  }

  let analysis: JevAnalysis | null = null
  if (jevKey) {
    input.onStage?.("analyzing")
    analysis = await analyzeWithJev(input.snapshot, jevKey, fetchImpl)
  }

  input.onStage?.("writing")
  const prompt = await writePrompt(
    input.settings.llmProvider,
    llmKey,
    buildInstructions(input.snapshot, input.stack, analysis),
    fetchImpl,
  )
  return { prompt, jevUsed: analysis !== null }
}

export function buildInstructions(
  snapshot: SectionSnapshot,
  stack: StackId,
  analysis: JevAnalysis | null,
): string {
  const facts = JSON.stringify(snapshot)
  const jev = analysis
    ? [
        "Jev analysis:",
        `component: ${analysis.component ?? "unknown"}`,
        `layout: ${analysis.layout ?? "unknown"}`,
        `density: ${analysis.density ?? "unknown"}`,
        `interactive: ${analysis.interactive === null ? "unknown" : String(analysis.interactive)}`,
      ].join("\n")
    : "Jev analysis: not requested."

  return [
    "Write a reconstruction prompt that a coding agent can follow to rebuild this one UI section.",
    stackInstruction(stack),
    "The user will attach a reference PNG separately. Do not include image data, base64, or a screenshot.",
    "Use only the facts below. Do not invent extra sections, pages, or navigation.",
    "Describe layout, hierarchy, text, typography, colors, spacing, borders, radius, and shadows when those facts exist.",
    "End by telling the agent to match the attached reference PNG.",
    "",
    jev,
    "",
    "Section facts:",
    facts,
  ].join("\n")
}
