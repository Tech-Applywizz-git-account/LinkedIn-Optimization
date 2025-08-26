// lib/variations.ts
export type SimilarityReport = {
  jaccard: number;
  overlap: number;
  exactDuplicate: boolean;
};

function normalize(text: string): string {
  return (text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[•▪·●■]/g, "-")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .toLowerCase();
}

function toTokens(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(tokens: string[], k = 3): string[] {
  if (tokens.length < k) return [tokens.join(" ")].filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - k; i++) {
    out.push(tokens.slice(i, i + k).join(" "));
  }
  return out;
}

export function jaccardSimilarity(a: string, b: string, k = 3): number {
  const ta = shingles(toTokens(a), k);
  const tb = shingles(toTokens(b), k);
  const setA = new Set(ta);
  const setB = new Set(tb);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter || 1;
  return inter / union;
}

export function tokenOverlap(a: string, b: string): number {
  const ta = new Set(toTokens(a));
  const tb = new Set(toTokens(b));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const denom = Math.min(ta.size, tb.size) || 1;
  return inter / denom;
}

export function compareSimilarity(a: string, b: string): SimilarityReport {
  const j = jaccardSimilarity(a, b, 3);
  const o = tokenOverlap(a, b);
  const exactDuplicate = normalize(a) === normalize(b);
  return { jaccard: j, overlap: o, exactDuplicate };
}

/** forgiving similarity gate */
export function isSufficientlyDifferent(
  candidate: string,
  previous: string[],
  opts?: {
    maxJaccard?: number;    // accept if jaccard ≤ this (default 0.96)
    maxOverlap?: number;    // accept if token-overlap ≤ this (default 0.95)
    minDeltaChars?: number; // accept if abs length diff ≥ (default 20)
  }
): { ok: boolean; worst?: SimilarityReport } {
  const maxJaccard = opts?.maxJaccard ?? 0.96;
  const maxOverlap = opts?.maxOverlap ?? 0.95;
  const minDeltaChars = opts?.minDeltaChars ?? 20;

  if (!previous?.length) return { ok: true };

  let worst: SimilarityReport | undefined;
  for (const prev of previous) {
    const rep = compareSimilarity(candidate, prev);
    if (!worst || rep.jaccard > worst.jaccard) worst = rep;

    const lengthDelta = Math.abs((candidate || "").length - (prev || "").length);
    if (rep.exactDuplicate) return { ok: false, worst: rep };
    if (rep.jaccard > maxJaccard && rep.overlap > maxOverlap && lengthDelta < minDeltaChars) {
      return { ok: false, worst: rep };
    }
  }
  return { ok: true, worst };
}

/** pick the most different value from a set of candidates w.r.t. a corpus */
export function pickMostDifferent(
  candidates: string[],
  corpus: string[]
): { index: number; value: string; score: number } {
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    let worstJ = 0;
    for (const p of corpus) {
      const j = jaccardSimilarity(c, p, 3);
      if (j > worstJ) worstJ = j;
    }
    const score = 1 - worstJ;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { index: bestIdx, value: candidates[bestIdx], score: bestScore };
}

/** Accept-or-fallback helper used by VariationGate */
export function decideAcceptance(
  attempts: string[],
  previous: string[],
  opts?: { maxJaccard?: number; maxOverlap?: number; minDeltaChars?: number }
): { content: string; accepted: boolean } {
  if (!attempts?.length) return { content: "", accepted: false };
  const last = attempts[attempts.length - 1];
  const { ok } = isSufficientlyDifferent(last, previous, opts);
  if (ok) return { content: last, accepted: true };

  // fallback to the most-different candidate among attempts
  const { value } = pickMostDifferent(attempts, previous);
  return { content: value, accepted: false };
}
