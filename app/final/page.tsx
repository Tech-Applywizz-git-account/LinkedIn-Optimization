// app/final/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { copyToClipboard } from "@/lib/utils";
import JSZip from "jszip";

/** ===== Types from your existing payload ===== */
type Payload = {
  meta: {
    targetRole: string;
    jobDescription: string;
    industry: string;
    generatedAt: string;
    personName?: string;
  };
  sections: {
    headline: string;
    about: string;
    experience: string;
    projects: string;
    education: string;
    skills: string;
    certifications: string;
    // banner: string;
  };
};

/** ===== Brand config (put logo.png in /public) ===== */
const COMPANY_NAME = "ApplyWizz";
const LOGO_URL = "/logo.png";

/** Strong markdown scrubber for both on-screen + download */
function sanitizeText(input: string | undefined | null): string {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");

  // Remove fenced code blocks ```lang ... ```
  s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));

  // Images ![alt](url) -> alt
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Links [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Headings: ### Title -> Title
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");

  // Blockquotes: > quote -> quote
  s = s.replace(/^\s{0,3}>\s?/gm, "");

  // HR lines: --- *** ___
  s = s.replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, "");

  // Lists: -, *, +, 1.
  s = s.replace(/^\s*([*\-+]|(\d+\.))\s+/gm, "");

  // Emphasis/strong: **bold**, *i*, __b__, _i_
  s = s.replace(/(\*{1,3})(\S(?:.*?\S)?)\1/g, "$2");
  s = s.replace(/(_{1,3})(\S(?:.*?\S)?)\1/g, "$2");

  // Inline code `code`
  s = s.replace(/`([^`]+)`/g, "$1");

  // Strip any leftover markdown tokens
  s = s.replace(/[>*#_]{1,}/g, "");

  // Collapse spaces & excess blank lines
  // Collapse spaces & excess blank lines + strip semicolons
s = s
  .replace(/[ \t]{2,}/g, " ")
  .replace(/\n{3,}/g, "\n\n")
  .replace(/;/g, "")      // <— remove all semicolons
  .trim();

  return s;
}

export default function FinalPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const router = useRouter();

  function startOver() {
    try { localStorage.removeItem("applywizz_final"); } catch {}
    router.push("/");
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("applywizz_final");
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  // Convert /public PNG into a data URL (so the downloaded HTML shows the logo offline)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(LOGO_URL);
        if (!res.ok) throw new Error("logo fetch failed");
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) setLogoDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logoSrc = logoDataUrl ?? LOGO_URL;

  /** Build a clean, plain-text version (for Copy All) */
  const plainText = useMemo(() => {
    if (!payload) return "";
    const { meta, sections } = payload;
    const S = (v: string) => sanitizeText(v || "");
    return [
      `${COMPANY_NAME} — Final Optimization`,
      ``,
      `Generated: ${new Date(meta.generatedAt).toLocaleString()}`,
      ``,
      `Headline`,
      S(sections.headline),
      ``,
      `About`,
      S(sections.about),
      ``,
      `Experience`,
      S(sections.experience),
      ``,
      `Projects`,
      S(sections.projects),
      ``,
      `Education`,
      S(sections.education),
      ``,
      `Skills`,
      S(sections.skills),
      ``,
      `Certifications`,
      S(sections.certifications),
      // ``,
      // `Banner Concepts`,
      // S(sections.banner),
    ].join("\n");
  }, [payload]);

  /** Self-contained HTML for download — no watermark; only date; sanitized text; logo embedded if possible */
  const htmlDoc = useMemo(() => {
    if (!payload) return "";
    const { meta, sections } = payload;
    const S = (v: string) => sanitizeText(v || "");

    const safe = {
      generatedAt: new Date(meta.generatedAt).toLocaleString(),
      headline: S(sections.headline),
      about: S(sections.about),
      experience: S(sections.experience),
      projects: S(sections.projects),
      education: S(sections.education),
      skills: S(sections.skills),
      certifications: S(sections.certifications),
      // banner: S(sections.banner),
    };

    const entries: Array<[string, string]> = [
      ["Headline", safe.headline],
      ["About", safe.about],
      ["Experience", safe.experience],
      ["Projects", safe.projects],
      ["Education", safe.education],
      ["Skills", safe.skills],
      ["Certifications", safe.certifications],
      // ["Banner Concepts", safe.banner],
    ];

    const escapeHtml = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${COMPANY_NAME} — Final Optimization</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, "Helvetica Neue", Arial, sans-serif; background:#fff; color:#0f172a; margin:0; }
  .container { max-width: 960px; margin: 0 auto; padding: 24px; }
  .letterhead { background:#fff; border-bottom:1px solid #e5e7eb; padding: 16px 0; }
  .lh-row { display:flex; align-items:center; gap:12px; }
  .logo { height:48px; width:auto; object-fit:contain; }
  .brand { font-weight:700; font-size:18px; letter-spacing:0.02em; }
  h1 { font-size:28px; margin:20px 0 6px; }
  .meta { color:#475569; font-size:14px; margin-bottom:16px; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
  .section { break-inside:avoid; page-break-inside:avoid; margin-bottom:20px; }
  .section h2 { font-size:18px; margin:0 0 8px; }
  .section div { white-space:pre-wrap; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:12px; font-size:14px; }
  @media print {
    .no-print { display:none !important; }
    .print-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section { break-inside:avoid; page-break-inside:avoid; }
  }
</style>
</head>
<body class="print-bg">
  <div class="container">
    <header class="letterhead">
      <div class="lh-row">
        <img src="${logoSrc}" alt="Company Logo" class="logo" />
        <div class="brand">${COMPANY_NAME}</div>
      </div>
    </header>

    <main>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <h1 style="margin:0">Final Optimization</h1>
        <div>
          <span style="font-size:14px;color:#475569">Generated: ${escapeHtml(safe.generatedAt)}</span>
        </div>
      </div>

      <section class="card" style="margin-top:16px">
        ${entries
          .map(
            ([t, c]) => `
          <div class="section">
            <h2>${t}</h2>
            <div>${escapeHtml(c)}</div>
          </div>`
          )
          .join("")}
      </section>
    </main>
  </div>
</body>
</html>`;
  }, [payload, logoSrc]);

  const [copiedAll, setCopiedAll] = useState(false);

  async function copyAll() {
    if (!plainText) return;
    const success = await copyToClipboard(plainText);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  }

  function downloadHtml() {
    if (!htmlDoc) return;
    const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applywizz_final_optimization.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadWord() {
    if (!payload) return;
    const { meta, sections } = payload;
    const S = (v: string) => sanitizeText(v || "");
    const personName = meta.personName || "";

    const entries: Array<[string, string]> = [
      ["Headline", S(sections.headline)],
      ["About", S(sections.about)],
      ["Experience", S(sections.experience)],
      ["Projects", S(sections.projects)],
      ["Education", S(sections.education)],
      ["Skills", S(sections.skills)],
      ["Certifications", S(sections.certifications)],
    ];

    // Helper: escape XML special chars
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

    // Build runs for a paragraph that can contain bold text (**bold**)
    function buildRuns(text: string, defaultBold = false, szHalf = 20): string {
      // Split on **...**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part) => {
        const isBold = defaultBold || /^\*\*[^*]+\*\*$/.test(part);
        const cleaned = esc(part.replace(/\*\*/g, ""));
        return `<w:r><w:rPr>${isBold ? "<w:b/><w:bCs/>" : ""}<w:sz w:val="${szHalf}"/><w:szCs w:val="${szHalf}"/></w:rPr><w:t xml:space="preserve">${cleaned}</w:t></w:r>`;
      }).join("");
    }

    // Build paragraph XML
    function para(runs: string, extraPPr = ""): string {
      return `<w:p><w:pPr>${extraPPr}</w:pPr>${runs}</w:p>`;
    }

    // Build a section block: bold heading (12pt=24half) + content paragraphs (11pt=22half)
    function buildSection(title: string, content: string): string {
      const headingPara = para(
        buildRuns(title, true, 24),
        "<w:spacing w:before=\"160\" w:after=\"80\"/>"
      );
      const lines = content.split("\n");
      const contentParas = lines.map((line) => {
        const trimmed = line.trim();
        // Detect bullet lines
        const isBullet = /^[•\-–—]/.test(trimmed);
        const cleaned = trimmed.replace(/^[•\-–—]\s*/, "");
        const justifyPPr = `<w:jc w:val="both"/>`;
        const indentPPr = isBullet
          ? `${justifyPPr}<w:spacing w:before="40" w:after="40"/><w:ind w:left="360" w:hanging="360"/>`
          : `${justifyPPr}<w:spacing w:before="40" w:after="40"/>`;
        const bulletPrefix = isBullet
          ? `<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">– </w:t></w:r>`
          : "";
        return para(bulletPrefix + buildRuns(cleaned, false, 20), indentPPr);
      });
      return [headingPara, ...contentParas].join("");
    }

    // ── Fetch image (used in the Word page-header, shown on every page) ──────────
    let logoBytes: ArrayBuffer | null = null;
    let headerLogoXml = "";
    const hdrLogoRelId = "rId1"; // relative to header1.xml.rels

    try {
      const res = await fetch("/image.png");
      if (res.ok) {
        logoBytes = await res.arrayBuffer();
        // Use a smaller logo size in the header (approx 2 inches wide)
        const cx = 1905000; 
        const cy = 431966;
        headerLogoXml = `<w:r><w:rPr/><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="HeaderImage"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="HeaderImage"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${hdrLogoRelId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
      }
    } catch { /* image optional */ }

    // ── Word page header (image.png, repeats on every page) ────────────
    const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:sdt>
    <w:sdtPr>
      <w:lock w:val="sdtContentLocked"/>
      <w:tag w:val="BrandHeader"/>
      <w:alias w:val="Brand Header"/>
    </w:sdtPr>
    <w:sdtContent>
      <w:p>
        <w:pPr><w:jc w:val="left"/><w:spacing w:after="80" w:before="0"/></w:pPr>
        ${headerLogoXml}
      </w:p>
    </w:sdtContent>
  </w:sdt>
  <w:p><w:pPr><w:spacing w:after="0" w:before="0"/></w:pPr></w:p>
</w:hdr>`;

    // Header relationship file (image path is relative to word/)
    const headerRelsXml = logoBytes
      ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="${hdrLogoRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image.png"/>
</Relationships>`
      : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;



    // Person name paragraph (14pt bold = 28 half), right aligned
    const namePara = personName
      ? para(buildRuns(personName, true, 28), `<w:jc w:val="right"/><w:spacing w:before="80" w:after="160"/>`)
      : "";

    // Sections
    const sectionsXml = entries
      .filter(([, c]) => c.trim())
      .map(([t, c]) => buildSection(t, c))
      .join("");

    // Full document body (no brand here — it lives in the page header)
    const bodyXml = [
      namePara,
      sectionsXml,
    ].join("");

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1800" w:right="1440" w:bottom="1440" w:left="1440" w:header="900" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`;

    // Settings XML: no protection — document is fully editable
    const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:settings>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr>
    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
    <w:sz w:val="20"/><w:szCs w:val="20"/>
    <w:color w:val="000000" w:themeColor="dark1" w:themeShade="FF"/>
  </w:rPr></w:rPrDefault></w:docDefaults>
</w:styles>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`;

    const appRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.file("_rels/.rels", appRelsXml);
    zip.file("word/document.xml", documentXml);
    zip.file("word/styles.xml", stylesXml);
    zip.file("word/settings.xml", settingsXml);
    zip.file("word/_rels/document.xml.rels", relsXml);
    zip.file("word/header1.xml", headerXml);
    zip.file("word/_rels/header1.xml.rels", headerRelsXml);
    if (logoBytes) {
      zip.file("word/media/image.png", logoBytes);
    }

    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applywizz_final_optimization.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!payload) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Final Optimization</h1>
        <p className="text-red-600">
          No data found. Please complete the 8-step wizard and approve the last step.
        </p>
      </main>
    );
  }

  const { meta, sections } = payload;
  const generatedStr = new Date(meta.generatedAt).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* print helpers */}
      <style>{`
        @media print {
          .no-print { display:none !important; }
          .print-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section-block { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Letterhead (no watermark, just logo + ApplyWizz). No action buttons here. */}
      <header className="bg-white border-b border-slate-200 print-bg">
        <div className="flex items-center gap-3 py-3">
          <img src={logoSrc} alt="Company Logo" className="h-12 w-auto object-contain" />
          <div className="text-xl font-bold tracking-wide text-gray-900">{COMPANY_NAME}</div>
        </div>
      </header>

      {/* Title row: buttons BESIDE the "Final Optimization" title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold m-0">Final Optimization</h1>

        {/* Actions are here, not in the header */}
        <div className="flex gap-2 no-print">
          <button
            onClick={startOver}
            className="px-3 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 font-medium"
          >
            ← Start Over
          </button>
          <button
            onClick={copyAll}
            className={`px-3 py-2 rounded border text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm ${
              copiedAll
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-50"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
            title="Copy all optimized sections to clipboard"
          >
            {copiedAll ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Copied All!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy All
              </>
            )}
          </button>
          <button onClick={downloadHtml} className="px-3 py-2 rounded border text-sm font-medium">Download HTML</button>
          <button
            onClick={downloadWord}
            className="px-3 py-2 rounded border text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download Word
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded border text-sm font-medium">Print</button>
        </div>
      </div>

      {/* Only date under the title (NO target role / industry) */}
      <p className="text-sm text-gray-600">Generated: {generatedStr}</p>

      {/* Sections: sanitized, no markdown symbols */}
      <section className="bg-white border rounded-xl p-5 space-y-6">
        <Block title="Headline" text={sanitizeText(sections.headline)} />
        <Block title="About" text={sanitizeText(sections.about)} />
        <Block title="Experience" text={sanitizeText(sections.experience)} />
        <Block title="Projects" text={sanitizeText(sections.projects)} />
        <Block title="Education" text={sanitizeText(sections.education)} />
        <Block title="Skills" text={sanitizeText(sections.skills)} />
        <Block title="Certifications" text={sanitizeText(sections.certifications)} />
        {/* <Block title="Banner Concepts" text={sanitizeText(sections.banner)} /> */}
      </section>
    </main>
    </div>
  );
}

/** Simple section block (no markdown, already sanitized) */
function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="section-block">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm whitespace-pre-wrap border rounded p-3 bg-gray-50">{text}</div>
    </div>
  );
}
