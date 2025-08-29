// app/final/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/** ===== Types from your existing payload ===== */
type Payload = {
  meta: {
    targetRole: string;
    jobDescription: string;
    industry: string;
    generatedAt: string;
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

  function copyAll() {
    if (!plainText) return;
    navigator.clipboard?.writeText(plainText).catch(() => {});
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
          <div className="text-xl font-bold tracking-wide">{COMPANY_NAME}</div>
        </div>
      </header>

      {/* Title row: buttons BESIDE the "Final Optimization" title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold m-0">Final Optimization</h1>

        {/* Actions are here, not in the header */}
        <div className="flex gap-2 no-print">
          <button onClick={copyAll} className="px-3 py-2 rounded border">Copy All</button>
          <button onClick={downloadHtml} className="px-3 py-2 rounded border">Download .md</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded border">Print</button>
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
