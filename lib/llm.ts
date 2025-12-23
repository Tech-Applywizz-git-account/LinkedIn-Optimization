// lib/llm.ts
import OpenAI from "openai";

const PROVIDER = (process.env.LLM_PROVIDER || "openai").toLowerCase();

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai!;
}

export async function llmComplete(prompt: string, opts?: { model?: string; temperature?: number; maxTokens?: number }) {
  // Force OpenAI only (no Gemini path here)
  if (PROVIDER !== "openai") {
    // Even if someone sets PROVIDER wrong, we still force OpenAI to avoid Gemini calls.
  }
  const client = getOpenAI();
  const resp = await client.chat.completions.create({
    model: opts?.model ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 800,
  });
  return (resp.choices?.[0]?.message?.content || "").trim();
}
