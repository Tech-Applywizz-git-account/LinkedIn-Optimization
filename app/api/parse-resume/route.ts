import { NextResponse } from "next/server";
import { parseResumeText } from "@/lib/resumeParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Helpers */
function ok(data: any, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 500, detail?: any) {
  console.error("[parse-resume]", message, detail || "");
  return NextResponse.json({ error: message, detail }, { status });
}
/**
 * Common PDF misread corrections.
 * pdf-parse sometimes garbles characters due to custom font encodings
 * (e.g., "Data" → "Dofa", "multisource" → "muisource").
 * This map fixes known substitutions after extraction.
  * Ordering matters: longer/more-specific patterns should come first.
 */
const PDF_MISREAD_FIXES: [RegExp, string][] = [
  // ===== Character Level Normalization (Handle font-scrambling) =====
  // These address the 'a'->'o', 't'->'f', 'n'->'m', 'l'->'i' substitutions generically in common words
  
  // 'Data' variations (o->a, f->t)
  [/D[o0]\s?f\s?[a@]/gi, "Data"],
  [/d[o0]\s?f\s?[a@]/gi, "data"],
  [/D[o0]\s?t\s?[a@]/gi, "Data"],
  [/d[o0]\s?t\s?[a@]/gi, "data"],

  // 'IBM' / 'Learning' / 'Certificate'
  [/BM\s?D[o0]f[a@]\s?An[a@][i|l]y[s$]t/gi, "IBM Data Analyst"],
  [/\bBM\b/g, "IBM"],
  [/Le[a@][m|n]ing/gi, "Learning"],
  [/Cerfific[a@]fe/gi, "Certificate"],
  [/Cerfi\s?fic[a@]fe/gi, "Certificate"],
  [/Specializ[a@]fio[n|m]/gi, "Specialization"],
  [/Cerfi\s?fic[a@]fion/gi, "Certification"],
  [/Cerfific[a@]fion/gi, "Certification"],

  // 'Technical' / 'Analytical' / 'Economics'
  [/Tech[n|m]ic[a@][i|l]/gi, "Technical"],
  [/An[a@][i|l]yf[i|l]c[a@][i|l]/gi, "Analytical"],
  [/An[a@][i|l]yfic[a@][i|l]/gi, "Analytical"],
  [/An[a@][i|l]yfical/gi, "Analytical"],
  [/Ec[o0][n|m][o0][n|m]ic[s$]/gi, "Economics"],

  // 'multi' / 'source' 
  [/mu[i|l][s$][o0]urce/gi, "multisource"],
  [/mu[i|l]fi/gi, "multi"],
  [/mui\s?source/gi, "multisource"],

  // 'reporting' / 'support'
  [/repor\s?f\s?ing/gi, "reporting"],
  [/reporfi\s?ng/gi, "reporting"],
  [/reporfing/gi, "reporting"],
  [/reporfi\b/gi, "reporti"],
  [/fo\s?support/gi, "to support"],
  [/fo\s?build/gi, "to build"],
  [/fo\s?deliver/gi, "to deliver"],
  [/fo\s?help/gi, "to help"],

  // Suffixes (-ation, -ated, -ting)
  [/iz[o0]fion\b/gi, "ization"],
  [/mofion\b/gi, "mation"],
  [/v[a@][i|l][i|l]d[o0]fion/gi, "validation"],
  [/prep[a@]r[o0]fion/gi, "preparation"],
  [/presen\s?f[o0]\s?fion/gi, "presentation"],
  [/oper[o0]fion[a@][i|l]/gi, "operational"],
  [/com[m|n]u[n|m]ic[o0]fion/gi, "communication"],
  [/org[a@]niz[o0]fion/gi, "organization"],
  [/im[p|l][i|l]e[m|n]en\s?f[o0]fion/gi, "implementation"],
  [/co[i|l][i|l][a@]b[o0]r[o0]fion/gi, "collaboration"],
  [/in\s?fegr[o0]fion/gi, "integration"],
  [/docu[m|n]en\s?f[o0]fion/gi, "documentation"],
  [/f\s?r[a@]nsf[o0]r[m|n][o0]fion/gi, "transformation"],

  // Common space-inserted garbles
  [/d[a@]\s*t[a@]/gi, "data"],
  [/an\s*al\s*y\s*st/gi, "analyst"],
  [/ex\s*per\s*i\s*ence/gi, "experience"],
];

function applyPdfMisreadFixes(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PDF_MISREAD_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function cleanText(s: string): string {
  if (!s) return "";
  let result = s
    .replace(/\u00A0/g, " ")      // NBSP -> space
    .replace(/\u200B/g, "")       // ZWSP -> remove
    .replace(/\r/g, "\n")
    .replace(/\u2013/g, "-")      // en-dash -> hyphen
    .replace(/\u2014/g, "-")      // em-dash -> hyphen
    .replace(/\u0000/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Apply PDF misread fixes
  const before = result;
  result = applyPdfMisreadFixes(result);
  
  if (before !== result) {
    console.log("PDF misread fixes applied to text.");
  }
  
  return result;
}

export async function GET() {
  return ok({ ok: true, msg: "parse-resume API alive" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return err("No file uploaded", 400);

    const name = (file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();
    const size = file.size;

    console.log(`[parse-resume] Received file: ${name} (${type}), size: ${size} bytes`);

    if (size > 10 * 1024 * 1024) {
      return err("File too large (max 10MB)", 422);
    }

    let text = "";

    /* TEXT-FIRST (always safe) */
    if (
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".markdown") ||
      name.endsWith(".json") ||
      type.includes("text/plain")
    ) {
      try {
        text = await file.text();
      } catch (e) {
        return err("Failed to read plain text file", 422, String(e));
      }
    }

    /* PDF */
    else if (type.includes("pdf") || name.endsWith(".pdf")) {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const ab = await file.arrayBuffer();
        const buf = Buffer.from(ab);
        const parsed = await pdfParse(buf);
        text = parsed.text || "";
      } catch (e) {
        return err("Failed to parse PDF (file may be scanned/secured)", 422, String(e));
      }
    }

    /* DOCX / DOCM — with robust fallbacks */
    else if (
      type.includes("wordprocessingml") ||
      name.endsWith(".docx") ||
      name.endsWith(".docm") ||
      // some browsers upload DOCX as octet-stream; allow by extension
      (name.endsWith(".docx") && type.includes("octet-stream"))
    ) {
      try {
        const mammoth = (await import("mammoth")).default;
        const { htmlToText } = await import("html-to-text");
        const ab = await file.arrayBuffer();

        // Fallback 1: raw text (often more tolerant)
        try {
          const raw = await mammoth.extractRawText({ arrayBuffer: ab });
          if (raw?.value && raw.value.trim().length > 0) {
            text = raw.value;
          }
        } catch (e1) {
          // ignore; try html path next
        }

        // Fallback 2: convert to HTML then to text
        if (!text) {
          try {
            const { value: html } = await mammoth.convertToHtml({ arrayBuffer: ab });
            const t = htmlToText(html, {
              wordwrap: false,
              selectors: [{ selector: "a", options: { ignoreHref: true } }],
            });
            if (t && t.trim().length > 0) text = t;
          } catch (e2) {
            // ignore; try ZIP path next
          }
        }

        // Fallback 3: unzip and read word/document.xml directly
        if (!text) {
          const JSZip = (await import("jszip")).default;
          const zip = await JSZip.loadAsync(ab);
          const entry = zip.file("word/document.xml");
          if (!entry) throw new Error("document.xml not found in docx");
          const xml = await entry.async("string");
          // crude XML->text strip
          const stripped = xml
            .replace(/<w:p[^>]*>/g, "\n")   // paragraph breaks
            .replace(/<[^>]+>/g, " ")       // strip tags
            .replace(/\s+/g, " ")
            .replace(/\n\s+/g, "\n")
            .trim();
          text = stripped;
        }
      } catch (e) {
        return err("Failed to parse DOCX (file may be corrupted)", 422, String(e));
      }
    }

    /* HTML */
    else if (name.endsWith(".html") || name.endsWith(".htm") || type.includes("text/html")) {
      try {
        const { htmlToText } = await import("html-to-text");
        const html = await file.text();
        text = htmlToText(html, {
          wordwrap: false,
          selectors: [{ selector: "a", options: { ignoreHref: true } }],
        });
      } catch (e) {
        return err("Failed to parse HTML", 422, String(e));
      }
    }

    /* RTF (best-effort) */
    else if (name.endsWith(".rtf") || type.includes("rtf")) {
      try {
        const raw = await file.text();
        text = raw
          .replace(/\\'[0-9a-fA-F]{2}/g, " ")
          .replace(/\\[a-zA-Z]+\\d*/g, " ")
          .replace(/[{}]/g, " ")
          .replace(/\\s+/g, " ")
          .trim();
      } catch (e) {
        return err("Failed to parse RTF", 422, String(e));
      }
    }

    /* Legacy .DOC (not supported on serverless) */
    else if (name.endsWith(".doc")) {
      return err(
        "Legacy .doc is not supported here. Please re-save your resume as PDF or DOCX and re-upload.",
        415
      );
    }

    /* Fallback: attempt text() */
    else {
      try {
        text = await file.text();
      } catch (e) {
        return err("Unsupported file type. Upload PDF, DOCX, TXT, RTF, HTML, MD, or JSON.", 415, String(e));
      }
    }

    text = cleanText(text);
    if (!text || !text.trim()) return err("Could not extract text from the file", 422);

    const structured = parseResumeText(text);
    return ok({ ok: true, text, parsed: structured }, 200);
  } catch (e) {
    return err("Failed to parse resume", 500, String(e));
  }
}
