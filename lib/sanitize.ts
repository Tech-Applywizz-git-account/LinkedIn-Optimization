// lib/sanitize.ts

/**
 * PDF font-encoding misread corrections.
 * When pdf-parse or pdfjs reads custom-font PDFs, certain characters
 * get decoded incorrectly (e.g. 'a'->'o', 't'->'f', 'n'->'m', 'l'->'i').
 * These patterns fix the most common garbled words.
 */
const MISREAD_PATTERNS: [RegExp, string][] = [
  // ===== 'Data' variants — the most common misread =====
  [/\bDofa\b/g, "Data"],
  [/\bdofa\b/g, "data"],
  [/\bDota\b/g, "Data"],
  [/\bdota\b/g, "data"],
  // Flexible pattern for spacing/variant char artifacts
  [/D[o0]\s?f\s?a/gi, "Data"],
  [/d[o0]\s?f\s?a/gi, "data"],

  // ===== IBM / Learning / Certificate =====
  [/\bBM\s+Data\s+Analyst\b/gi, "IBM Data Analyst"],
  [/\bBM\s+Dofa\s+Analyst\b/gi, "IBM Data Analyst"],
  [/\bBM\b/g, "IBM"],
  [/\bLeaming\b/gi, "Learning"],
  [/\bCerfiicate\b/gi, "Certificate"],
  [/\bCerfificate\b/gi, "Certificate"],
  [/\bCerfification\b/gi, "Certification"],
  [/\bCerfification\b/gi, "Certification"],
  [/\bSpecializafion\b/gi, "Specialization"],
  [/\bSpecialzafion\b/gi, "Specialization"],

  // ===== 'analytical' / 'analytics' =====
  [/\banalyfical\b/gi, "analytical"],
  [/\bAnalyfical\b/gi, "Analytical"],
  [/\banalyfics\b/gi, "analytics"],
  [/\bAnalyfics\b/gi, "Analytics"],

  // ===== 'multisource' / 'multi' =====
  [/\bmuisource\b/gi, "multisource"],
  [/\bmuiti\b/gi, "multi"],
  [/\bmui\s+source\b/gi, "multisource"],

  // ===== 'reporting' =====
  [/\breporfing\b/gi, "reporting"],
  [/\breporfi\s*ng\b/gi, "reporting"],

  // ===== 'to' garbles =====
  [/\bfo\s+support\b/gi, "to support"],
  [/\bfo\s+build\b/gi, "to build"],
  [/\bfo\s+deliver\b/gi, "to deliver"],
  [/\bfo\s+help\b/gi, "to help"],
  [/\bfo\s+provide\b/gi, "to provide"],
  [/\bfo\s+manage\b/gi, "to manage"],

  // ===== '-ization' suffix =====
  [/\bvisualizafion\b/gi, "visualization"],
  [/\bautomafion\b/gi, "automation"],
  [/\bvalidafion\b/gi, "validation"],
  [/\bpresenfafion\b/gi, "presentation"],
  [/\bimplemenafion\b/gi, "implementation"],
  [/\borganizafion\b/gi, "organization"],
  [/\bcommunicafion\b/gi, "communication"],
  [/\bcollaborafion\b/gi, "collaboration"],
  [/\bintegrafion\b/gi, "integration"],
  [/\bdocumenfafion\b/gi, "documentation"],
  [/\btransformafion\b/gi, "transformation"],

  // ===== Space-inserted garbles (kerning issues) =====
  [/\bd a t a\b/gi, "data"],
  [/\ba n a l y s t\b/gi, "analyst"],
  [/\ban al yst\b/gi, "analyst"],
  [/\bda ta\b/gi, "data"],
];

function applyMisreadFixes(text: string): string {
  let res = text;
  for (const [pattern, replacement] of MISREAD_PATTERNS) {
    res = res.replace(pattern, replacement);
  }
  return res;
}

/**
 * Master sanitization function — applied to ALL text in the app.
 * Layer 1: PDF misread character fixes (Dofa → Data, etc.)
 * Layer 2: Markdown noise removal
 * Layer 3: HTML entity decoding
 * Layer 4: Dash normalization
 * Layer 5: Whitespace cleanup
 */
export function sanitizeLLMText(input: string): string {
  if (!input) return input;

  // Layer 1: Fix PDF font misreads FIRST (before any other processing)
  let out = applyMisreadFixes(input);

  // Layer 2: Markdown & noise removal
  out = out
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/__(.+?)__/gs, "$1")
    .replace(/_(.+?)_/gs, "$1")
    .replace(/`{1,3}(.+?)`{1,3}/gs, "$1")
    .replace(/\*/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*\*\*(.+?)\*\*\s*$/gm, "$1")
    .replace(/[ \t]+$/gm, "")
    .trim();

  // Layer 3: HTML entities
  out = out
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");

  out = out.replace(/(\s)&(\s)/g, "$1and$2");

  // Layer 4: Dash normalization
  out = out
    .replace(/^\s*[\-\u2022\u25CF\u25AA\u00B7]\s+/gm, "– ")
    .replace(/^\s*\+\s+/gm, "– ");
  out = out.replace(/(\s)[\-\u2013\u2014](\s)/g, "$1–$2");
  out = out.replace(/(\s)--(\s)/g, "$1–$2");

  // Layer 5: Whitespace cleanup
  out = out.replace(/[ ]{2,}/g, " ").replace(/ ?\n ?/g, "\n").trim();

  return out;
}
