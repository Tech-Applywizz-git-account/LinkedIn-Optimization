// lib/textRewrite.ts
// Conservative utilities to reduce repeated "and" usage while preserving keywords.
export function rewriteResumeText(input: string): string {
  if (!input) return input;

  // Normalize line endings
  const lines = input.replace(/\r\n/g, "\n").split("\n");

  // Small verb list to avoid turning verb phrases into comma lists
  const verbHints = [
    " is ", " are ", " was ", " were ", " become ", " became ", " develop", " designed", " led", " manage", " managed", " develop", " builds", " built", " implement", " implemented", " improved", " reduce", " increased", " using ", " via ", " by ", " for ", " to ", " with ", " deliver", " delivered",
  ];

  function safeReplaceAnd(line: string) {
    // If line is a bullet or a skills line, aggressively replace ' and ' with ', '
    if (/^\s*[-•*]/.test(line) || /\b(Skills|Key Skills|Technical Skills|Certifications|Tools|Software)\b/i.test(line)) {
      return line.replace(/\s+and\s+/gi, ", ");
    }

    // If line contains more than one ' and ', it's likely a list — replace them with commas
    const andCount = (line.match(/\band\b/gi) || []).length;
    if (andCount >= 2) return line.replace(/\s+and\s+/gi, ", ");

    // Heuristic: replace 'A and B' with 'A, B' only when both sides look like noun phrases (no verb hints)
    return line.replace(/([\w\-\/%&()\.:,\s]{1,80}?)\s+and\s+([\w\-\/%&()\.:,\s]{1,80}?)(?=[,\.\n]|$)/gi, (m, a, b) => {
      const la = a.toLowerCase();
      const lb = b.toLowerCase();
      const hasVerb = verbHints.some(v => la.includes(v) || lb.includes(v));
      if (hasVerb) return `${a} and ${b}`;
      // Avoid touching short constructs like "R&D" or "AT&T"
      if (/&/.test(a) || /&/.test(b)) return `${a} and ${b}`;
      return `${a.trim()}, ${b.trim()}`;
    });
  }

  const out = lines.map((ln) => safeReplaceAnd(ln));

  // Final cleanup: collapse duplicate commas/spaces
  return out
    .join("\n")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

export default { rewriteResumeText };
