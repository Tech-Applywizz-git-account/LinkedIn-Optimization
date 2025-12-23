// lib/generateSection.ts
import { VariationGate } from "@/lib/variationGate";

export type GeneratePayload = {
  section: string;
  targetRole?: string;
  resumeText: string;
  jobDescription?: string;
  industry?: string;
  keywords?: string[];
  variation?: number;
  avoidText?: string;
  subIndex?: number;
  roleContext?: {
    title?: string;
    company?: string;
    location?: string;
    start?: string;
    end?: string;
    bullets?: string[];
    raw?: string;
  } | null;
  mode?: "manual" | "auto";
  modelOverride?: string;
};

function coerceToString(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch { return String(x); }
}

function pickContentShape(json: any): string {
  if (!json) return "";

  // 1) Our preferred field
  if (typeof json.content === "string") return json.content.trim();
  // 2) If content is object/array, stringify it
  if (json.content && typeof json.content !== "string") {
    const s = coerceToString(json.content).trim();
    if (s) return s;
  }
  // 3) Older/alternate field
  if (typeof json.text === "string") return json.text.trim();

  // 4) Responses API direct passthroughs (in case you ever forward the raw)
  if (typeof json.output_text === "string") return json.output_text.trim();
  if (Array.isArray(json.output)) {
    const stitched = json.output
      .map((o: any) =>
        Array.isArray(o?.content)
          ? o.content.map((c: any) => c?.text ?? "").join("")
          : ""
      )
      .join("")
      .trim();
    if (stitched) return stitched;
  }

  // 5) Nested content cases
  if (json?.content?.value && typeof json.content.value === "string") {
    return json.content.value.trim();
  }

  return "";
}

export async function generateWithVariation(
  payload: GeneratePayload,
  previousContents: string[],
  cfg?: { maxAttempts?: number }
): Promise<{ content: string; accepted: boolean }> {
  const gate = new VariationGate({ maxAttempts: cfg?.maxAttempts ?? 3 });

  const result = await gate.tryDifferent(async (nonce) => {
    const res = await fetch("/api/generate-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, nonce }),
    });

    const raw = await res.text();
    let json: any = null;
    try { json = JSON.parse(raw); } catch { /* non-JSON error body */ }

    if (!res.ok) {
      const msg =
        (json && (json.error || json.detail)) ||
        raw ||
        `HTTP ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    const content = pickContentShape(json);
    if (!content?.trim()) {
      // Give you the body we saw to debug quickly
      throw new Error(
        `The generator returned no content. Payload ok; response had keys: ${Object.keys(json || {}).join(", ") || "none"}`
      );
    }

    return content;
  }, previousContents);

  return { content: result.content, accepted: result.accepted };
}
