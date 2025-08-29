// lib/sanitize.ts
// Strip common Markdown noise, fix ampersands, and normalize dashes to EN DASH (–).
export function sanitizeLLMText(input: string): string {
  if (!input) return input;

  let out = (input as string)
    // normalize Windows newlines
    .replace(/\r\n/g, "\n")
    // remove bold/italic markers (**bold**, *italic*, __bold__, _italic_)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // remove inline code/backticks
    .replace(/`{1,3}(.+?)`{1,3}/g, "$1")
    // strip leftover asterisks anywhere
    .replace(/\*/g, "")
    // strip leading markdown headings (##, ###, etc.)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    // strip leading markdown bold titles like **PROJECT**:
    .replace(/^\s*\*\*(.+?)\*\*\s*$/gm, "$1")
    // trim trailing spaces per line
    .replace(/[ \t]+$/gm, "")
    .trim();

  // --- AMPERSANDS ---
  // Decode common HTML entities first
  out = out
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");

  // Replace standalone ampersands used as a word joiner with "and"
  // (only when there is whitespace around it to avoid "AT&T" etc.)
  out = out.replace(/(\s)&(\s)/g, "$1and$2");

  // --- DASH NORMALIZATION -> EN DASH (–) ---
  // 1) Normalize bullet leaders to "– " (en dash + space)
  // Matches -, •, ●, ▪, ·, + at the start of a line.
  out = out
    .replace(/^\s*[\-\u2022\u25CF\u25AA\u00B7]\s+/gm, "– ")
    .replace(/^\s*\+\s+/gm, "– ");

  // 2) Convert any spaced dash to an EN DASH:
  // "AWS - EC2", "AWS – EC2", "AWS — EC2" => "AWS – EC2"
  out = out.replace(/(\s)[\-\u2013\u2014](\s)/g, "$1–$2");

  // 3) Optional: convert ASCII double-dash between spaces to EN DASH
  out = out.replace(/(\s)--(\s)/g, "$1–$2");

  // DO NOT touch hyphenated words or date ranges without spaces (e.g., 2019-2021, micro-services)

  // Clean extra spaces/newlines
  out = out.replace(/[ ]{2,}/g, " ").replace(/ ?\n ?/g, "\n").trim();

  return out;
}
