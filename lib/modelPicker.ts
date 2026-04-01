// lib/modelPicker.ts
// ✅ Model chooser + token/cost helpers for OpenAI GPT-5 (mini/flagship/nano)

import { encode } from "gpt-tokenizer";

export type LLMModel = "gpt-4o" | "gpt-4o-mini";

// Pricing (USD) per 1M tokens — using GPT-4o and GPT-4o-mini rates
export const PRICING_USD_PER_1M: Record<string, { in: number; out: number }> = {
  "gpt-4o":      { in: 2.50, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out:  0.6 },
};

// Fast local token counter (approx; API usage is authoritative)
export function countTokens(text: string): number {
  return encode(text ?? "").length;
}

// Manual rule-based picker by section
export function pickBySection(section: string): LLMModel {
  const s = (section || "").toLowerCase();
  // Narrative/nuanced sections → mini
  if (["about", "experience", "projects", "education"].includes(s)) return "gpt-4o-mini";
  // Short/structured sections → nano (use mini as well)
  if (["headline", "skills", "certifications", "banner"].includes(s)) return "gpt-4o-mini";
  return "gpt-4o-mini";
}

// Auto picker by input size (keeps cost low while protecting quality)
export function pickAuto(systemPrompt: string, userPrompt: string): LLMModel {
  const input = countTokens(systemPrompt) + countTokens(userPrompt);
  // Long inputs (resume + JD etc.) benefit from mini; short prompts can use mini
  return input > 3000 ? "gpt-4o-mini" : "gpt-4o-mini";
}

// INR cost preview (uses a max output budget; real usage returned by API may differ)
export function estimateCostINR(
  model: LLMModel,
  inputTokens: number,
  outputBudgetTokens: number,
  inrRate = 83
): { usd: number; inr: number } {
  const p = PRICING_USD_PER_1M[model];
  const usd =
    (inputTokens / 1_000_000) * p.in +
    (outputBudgetTokens / 1_000_000) * p.out;
  return { usd, inr: usd * inrRate };
}
