// Strip common Markdown noise from LLM outputs
export function sanitizeLLMText(input: string): string {
  if (!input) return input;

  return (
    input
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
      // optional: strip leading markdown headings (##, ###, etc.)
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      // optional: strip leading markdown bold on titles like **PROJECT**:
      .replace(/^\s*\*\*(.+?)\*\*\s*$/gm, "$1")
      // keep bullets but normalize them to "- "
      .replace(/^\s*[\-\u2022]\s+/gm, "- ")
      .replace(/^\s*\+\s+/gm, "- ")
      .replace(/^\s*\d+\.\s+/gm, (m) => m) // keep numbered lists as-is
      // trim trailing spaces per line
      .replace(/[ \t]+$/gm, "")
      .trim()
  );
}
