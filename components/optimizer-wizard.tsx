"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedResume } from "@/lib/resumeParser";

type SectionKey =
  | "headline" | "about" | "experience" | "projects"
  | "education" | "skills" | "certifications" | "banner";

const STEPS: { key: SectionKey; title: string; helper: string }[] = [
  { key: "headline",       title: "1) Headline",        helper: "Concise, keyword-rich headline under 220 chars." },
  { key: "about",          title: "2) About",           helper: "3 short paragraphs: intro, achievements, closing." },
  { key: "experience",     title: "3) Experience",      helper: "Outcome-focused bullets with bolded tools." },
  { key: "projects",       title: "4) Projects",        helper: "2–4 key projects; quantified results." },
  { key: "education",      title: "5) Education",       helper: "Reverse-chronological; relevant coursework." },
  { key: "skills",         title: "6) Skills",          helper: "30–35 skills, grouped, top 10 bolded." },
  { key: "certifications", title: "7) Certifications",  helper: "Max 6; trusted orgs; fill gaps from JD." },
  { key: "banner",         title: "8) Banner Concepts", helper: "2–3 concepts + one AI image prompt." },
];

interface WizardProps {
  resumeText: string;
  parsed: ParsedResume | null;
  targetRole: string;
  jobDescription: string;
  industry?: string;
  keywords?: string[];
}

/** Infer Years of Experience from parsed resume or raw text (fallback). */
function inferYOE(parsed: any, resumeText: string): number {
  const fromParsed =
    parsed?.totalYears ??
    parsed?.years ??
    parsed?.yoe ??
    parsed?.overallExperience;
  if (typeof fromParsed === "number" && isFinite(fromParsed)) {
    const n = Math.max(0, Math.min(50, Math.round(fromParsed)));
    return n || 1;
  }
  const m = resumeText.match(/(\d{1,2})\s*\+?\s*(years?|yrs?)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (isFinite(n)) return Math.max(1, Math.min(50, n));
  }
  return 1;
}

export default function OptimizerWizard({
  resumeText,
  parsed,
  targetRole,
  jobDescription,
  industry,
  keywords = [],
}: WizardProps) {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [outputs, setOutputs] = useState<Record<SectionKey, string>>({
    headline: "", about: "", experience: "", projects: "",
    education: "", skills: "", certifications: "", banner: "",
  });

  const [approved, setApproved] = useState<Record<SectionKey, boolean>>({
    headline: false, about: false, experience: false, projects: false,
    education: false, skills: false, certifications: false, banner: false,
  });

  const [regenCount, setRegenCount] = useState<Record<SectionKey, number>>({
    headline: 0, about: 0, experience: 0, projects: 0,
    education: 0, skills: 0, certifications: 0, banner: 0,
  });

  // Viewer modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSection, setViewerSection] = useState<SectionKey | null>(null);

  const step = STEPS[stepIndex];

  function openViewer(forSection: SectionKey) {
    setViewerSection(forSection);
    setViewerOpen(true);
  }
  function closeViewer() {
    setViewerOpen(false);
    setViewerSection(null);
  }

  // ========= EXPERIENCE: N parts (based on YOE) =========
  const yoe = useMemo(() => inferYOE(parsed, resumeText), [parsed, resumeText]);
  // cap so the UI doesn’t explode (adjust if you want)
  const expPartsCount = Math.max(1, Math.min(yoe, 6));

  // store each generated experience block; index 0 is most recent role
  const [expParts, setExpParts] = useState<string[]>(Array(expPartsCount).fill(""));

  // If YOE changes (e.g., new resume), resize expParts array
  if (expParts.length !== expPartsCount) {
    const resized = Array(expPartsCount).fill("");
    for (let i = 0; i < Math.min(expParts.length, expPartsCount); i++) {
      resized[i] = expParts[i];
    }
    setExpParts(resized);
  }

  // ========= GENERATION =========
  async function callGenerator(
    section: SectionKey,
    avoidText: string,
    variation: number,
    subIndex?: number // 0-based experience index
  ) {
    const nonce = Math.random().toString(36).slice(2);

    // server call (with light 429 handling)
    let attempt = 0;
    const maxAttempts = 2;

    while (true) {
      const res = await fetch("/api/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          targetRole,
          resumeText,
          jobDescription,
          industry: industry || "",
          variation,
          avoidText,
          nonce,
          keywords,
          subIndex, // tell server which experience slice this is
        }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}

      if (res.ok) return (data?.content as string) || "";

      const msg = data?.error || text || `HTTP ${res.status}`;
      if (res.status === 429 || /quota|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg)) {
        if (attempt < maxAttempts) {
          attempt += 1;
          await new Promise(r => setTimeout(r, 1500 * attempt));
          continue;
        }
        throw new Error("Gemini quota exceeded for your project today. Try a different model, add billing, or wait for the quota to reset.");
      }
      throw new Error(msg);
    }
  }

  async function generate(section: SectionKey) {
    // Non-experience sections behave as before
    if (section === "experience") return;

    setBusy(true);
    setError(null);
    try {
      const prev = (outputs[section] || "").trim();
      let tries = 0;
      let nextText = "";
      let nextVariation = regenCount[section];

      while (tries < 8) {
        nextVariation = prev ? nextVariation + 1 : 0;
        const candidate = (await callGenerator(section, prev, nextVariation)).trim();
        const normPrev = prev.replace(/\s+/g, " ").toLowerCase();
        const normNext = candidate.replace(/\s+/g, " ").toLowerCase();
        if (!prev || normPrev !== normNext) { nextText = candidate; break; }
        tries += 1;
      }

      if (!nextText) throw new Error("Could not generate a sufficiently different variation after several tries. Please try again.");

      setOutputs((o) => ({ ...o, [section]: nextText }));
      setApproved((a) => ({ ...a, [section]: false }));
      setRegenCount((r) => ({ ...r, [section]: nextVariation }));
    } catch (e: any) {
      setError(e?.message || "Failed to generate");
    } finally {
      setBusy(false);
    }
  }

  // Generate or regenerate a specific Experience part (0-based index)
  async function generateExperiencePart(index: number) {
    setBusy(true);
    setError(null);
    try {
      const current = (expParts[index] || "").trim();
      let tries = 0;
      let nextText = "";
      let nextVariation = regenCount.experience;

      while (tries < 8) {
        nextVariation = current ? nextVariation + 1 : 0;

        // avoid duplicating any existing experience blocks
        const avoid = expParts.filter((_, i) => i !== index && expParts[i]).join("\n\n");

        const candidate = (await callGenerator("experience", avoid, nextVariation, index)).trim();

        const normPrev = (current || "").replace(/\s+/g, " ").toLowerCase();
        const normNext = candidate.replace(/\s+/g, " ").toLowerCase();
        if (!current || normPrev !== normNext) { nextText = candidate; break; }
        tries += 1;
      }

      if (!nextText) throw new Error("Could not generate a sufficiently different variation after several tries. Please try again.");

      // update the specific part
      setExpParts((parts) => {
        const copy = [...parts];
        copy[index] = nextText;
        // keep outputs.experience as combined so Approve & Next works
        const combined = copy.filter(Boolean).join("\n\n").trim();
        setOutputs((o) => ({ ...o, experience: combined }));
        setApproved((a) => ({ ...a, experience: false }));
        return copy;
      });

      setRegenCount((r) => ({ ...r, experience: nextVariation }));
    } catch (e: any) {
      setError(e?.message || "Failed to generate experience");
    } finally {
      setBusy(false);
    }
  }

  function approveAndNext() {
    const k = step.key;
    if (!outputs[k]?.trim()) return;

    // ensure experience combined text is saved even without the preview
    if (k === "experience") {
      const combined = expParts.filter(Boolean).join("\n\n").trim();
      if (combined) {
        setOutputs((o) => ({ ...o, experience: combined }));
      }
    }

    setApproved((a) => ({ ...a, [k]: true }));

    if (stepIndex >= STEPS.length - 1) {
      const payload = {
        meta: {
          targetRole,
          jobDescription,
          industry: industry || "",
          generatedAt: new Date().toISOString(),
          keywords,
        },
        sections: { ...outputs },
        resumeText,
      };
      try { localStorage.setItem("applywizz_final", JSON.stringify(payload)); } catch {}
      router.push("/final");
      return;
    }

    setStepIndex(stepIndex + 1);
  }

  function prev() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function titleFor(k: SectionKey) {
    return STEPS.find(s => s.key === k)?.title.replace(/^\d+\)\s*/, "") || k;
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 border rounded-xl p-4 bg-white">
          <h3 className="font-bold mb-3">LinkedIn Optimizer</h3>
          <ol className="space-y-2 text-sm">
            {STEPS.map((s, i) => {
              const isCurrent = i === stepIndex;
              const isApproved = approved[s.key];
              const canView = isApproved && (outputs[s.key]?.trim()?.length ?? 0) > 0;

              return (
                <li key={s.key} className={`flex items-center justify-between gap-2 ${isCurrent ? "font-semibold" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-5 h-5 rounded-full text-center text-xs ${
                      isApproved ? "bg-green-600 text-white" : isCurrent ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}>
                      {isApproved ? "✓" : i + 1}
                    </span>
                    <span>{s.title}</span>
                  </div>

                  {/* View button only after approval */}
                  {canView && (
                    <button
                      onClick={() => openViewer(s.key)}
                      className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
                      title="View approved content"
                    >
                      View
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-4 text-xs text-gray-500">
            {step.helper}
          </div>
        </aside>

        {/* Main panel */}
        <section className="lg:col-span-4 border rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{step.title}</h2>
            <div className="flex gap-2">
              {/* Default Generate/Regenerate for non-experience steps */}
              {step.key !== "experience" && (
                <button
                  onClick={() => generate(step.key)}
                  disabled={busy}
                  className="px-3 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
                  title="Regenerate will try to produce a different variation (up to 8 attempts)"
                >
                  {outputs[step.key] ? "Regenerate" : "Generate"}
                </button>
              )}
              <button
                onClick={approveAndNext}
                disabled={busy || !outputs[step.key]}
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                Approve & Next
              </button>
            </div>
          </div>

          {busy && <p className="text-blue-600">Generating…</p>}
          {error && (
            <pre className="mt-3 whitespace-pre-wrap text-red-700 bg-red-50 border border-red-200 p-3 rounded">{error}</pre>
          )}

          {/* Default empty state for non-experience */}
          {!outputs[step.key] && !busy && !error && step.key !== "experience" && (
            <p className="text-gray-600">Click <b>Generate</b> to create this section.</p>
          )}

          {/* ========== EXPERIENCE (dynamic N buttons; NO combined preview) ========== */}
          {step.key === "experience" && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500">
                Detected Years of Experience: <b>{yoe}</b> • Parts: <b>{expPartsCount}</b>
              </div>

              {/* Buttons row: sequential enablement */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: expPartsCount }).map((_, i) => {
                  const label = expParts[i] ? `Regenerate Experience ${i + 1}` : `Generate Experience ${i + 1}`;
                  const disabled = busy || (i > 0 && !expParts[i - 1]); // only next after previous exists
                  return (
                    <button
                      key={i}
                      onClick={() => generateExperiencePart(i)}
                      disabled={disabled}
                      className={`px-3 py-2 rounded text-white disabled:opacity-50 ${i === 0 ? "bg-gray-800" : "bg-gray-700"}`}
                      title={i > 0 && !expParts[i - 1] ? `Generate Experience ${i} first` : ""}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Editors for each generated part */}
              {expParts.map((val, i) =>
                val ? (
                  <div key={i} className="mt-3">
                    <div className="text-xs font-semibold mb-1 text-gray-600">Experience {i + 1}</div>
                    <textarea
                      value={val}
                      onChange={(e) => {
                        setExpParts((parts) => {
                          const copy = [...parts];
                          copy[i] = e.target.value;
                          const combined = copy.filter(Boolean).join("\n\n").trim();
                          setOutputs((o) => ({ ...o, experience: combined }));
                          return copy;
                        });
                      }}
                      className="w-full min-h-48 max-h-[50vh] resize-y border rounded p-3 text-sm"
                    />
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Other steps: unchanged textarea */}
          {step.key !== "experience" && outputs[step.key] && (
            <div className="mt-3">
              <textarea
                value={outputs[step.key]}
                onChange={(e) => setOutputs((o) => ({ ...o, [step.key]: e.target.value }))}
                className="w-full min-h-60 max-h-[60vh] h-72 resize-y border rounded p-3 text-sm"
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={busy || stepIndex === 0}
              className="px-3 py-2 rounded border disabled:opacity-50"
            >
              Back
            </button>
            <div className="text-xs text-gray-500">
              {approved[step.key]
                ? (stepIndex === STEPS.length - 1 ? "Approved — Finishing…" : "Approved")
                : "Awaiting approval"}
            </div>
          </div>
        </section>
      </div>

      {/* Scrollable MODAL for "View" */}
      {viewerOpen && viewerSection && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeViewer} />
          {/* Modal container */}
          <div className="absolute inset-x-0 top-[6%] mx-auto w-[95%] max-w-3xl">
            <div className="bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
              {/* Sticky header */}
              <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0">
                <h3 className="font-semibold">{titleFor(viewerSection!)}</h3>
                <button
                  onClick={closeViewer}
                  className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
                >
                  Close
                </button>
              </div>
              {/* Scrollable content */}
              <div className="p-4 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-3 overflow-auto">
{outputs[viewerSection!]}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
