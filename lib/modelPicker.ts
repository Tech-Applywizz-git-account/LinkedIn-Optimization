// lib/modelPicker.ts
// ✅ Model chooser + token/cost helpers for OpenAI GPT-5 (mini/flagship/nano)

import { encode } from "gpt-tokenizer";

export type LLMModel = "gpt-5-flagship" | "gpt-5-mini" | "gpt-5-nano";

// Pricing (USD) per 1M tokens — adjust if your account uses a different rate
export const PRICING_USD_PER_1M: Record<LLMModel, { in: number; out: number }> = {
  "gpt-5-flagship": { in: 1.25, out: 10.0 },
  "gpt-5-mini":     { in: 0.25, out:  2.0 },
  "gpt-5-nano":     { in: 0.05, out:  0.4 },
};

// Fast local token counter (approx; API usage is authoritative)
export function countTokens(text: string): number {
  return encode(text ?? "").length;
}

// Manual rule-based picker by section
export function pickBySection(section: string): LLMModel {
  const s = (section || "").toLowerCase();
  // Narrative/nuanced sections → mini
  if (["about", "experience", "projects", "education"].includes(s)) return "gpt-5-mini";
  // Short/structured sections → nano
  if (["headline", "skills", "certifications", "banner"].includes(s)) return "gpt-5-nano";
  return "gpt-5-mini";
}

// Auto picker by input size (keeps cost low while protecting quality)
export function pickAuto(systemPrompt: string, userPrompt: string): LLMModel {
  const input = countTokens(systemPrompt) + countTokens(userPrompt);
  // Long inputs (resume + JD etc.) benefit from mini; short prompts can use nano
  return input > 3000 ? "gpt-5-mini" : "gpt-5-nano";
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
