// lib/llm.ts
import { AzureOpenAI } from "openai";

const PROVIDER = (process.env.LLM_PROVIDER || "openai").toLowerCase();

let openai: AzureOpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing AZURE_OPENAI_API_KEY");
    }
    openai = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    });
  }
  return openai!;
}

export async function llmComplete(prompt: string, opts?: { model?: string; temperature?: number; maxTokens?: number }) {
  // Force OpenAI only (no Gemini path here)
  if (PROVIDER !== "openai") {
    // Even if someone sets PROVIDER wrong, we still force OpenAI to avoid Gemini calls.
  }
  const client = getOpenAI();
  
  const useJsonMode = (process.env.AZURE_USE_JSON_MODE || "true").toLowerCase() === "true";
  const maxTokens = parseInt(process.env.AZURE_MAX_TOKENS || "16000");

  const resp = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT || opts?.model || "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? maxTokens,
  });
  return (resp.choices?.[0]?.message?.content || "").trim();
}
