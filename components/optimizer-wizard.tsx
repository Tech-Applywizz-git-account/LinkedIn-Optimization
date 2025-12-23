// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import type { ParsedResume } from "@/lib/resumeParser";
// import { generateWithVariation } from "@/lib/generateSection";

// type SectionKey =
//   | "headline" | "about" | "experience" | "projects"
//   | "education" | "skills" | "certifications" | "banner";

// const STEPS: { key: SectionKey; title: string; helper: string }[] = [
//   { key: "headline",       title: "1) Headline",        helper: "Concise, keyword-rich headline under 220 chars." },
//   { key: "about",          title: "2) About",           helper: "3 short paragraphs: intro, achievements, closing." },
//   { key: "experience",     title: "3) Experience",      helper: "Full Experience section (all companies), outcome-focused bullets." },
//   { key: "projects",       title: "4) Projects",        helper: "2–4 key projects; quantified results." },
//   { key: "education",      title: "5) Education",       helper: "Reverse-chronological; relevant coursework." },
//   { key: "skills",         title: "6) Skills",          helper: "30–35 skills, grouped, top 10 bolded." },
//   { key: "certifications", title: "7) Certifications",  helper: "Max 6; from resume only." },
//   { key: "banner",         title: "8) Banner Concepts", helper: "2–3 concepts + one AI image prompt." },
// ];

// interface WizardProps {
//   resumeText: string;
//   parsed: ParsedResume | null;   // kept for compatibility; not needed for single-shot experience
//   targetRole: string;
//   jobDescription: string;
//   industry?: string;
//   keywords?: string[];
// }

// function titleForStep(key: SectionKey) {
//   return STEPS.find(s => s.key === key)?.title.replace(/^\d+\)\s*/, "") || key;
// }

// export default function OptimizerWizard({
//   resumeText,
//   parsed,                // eslint-disable-line @typescript-eslint/no-unused-vars
//   targetRole,
//   jobDescription,
//   industry,
//   keywords = [],
// }: WizardProps) {
//   const router = useRouter();

//   const [stepIndex, setStepIndex] = useState(0);
//   const [busy, setBusy] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [outputs, setOutputs] = useState<Record<SectionKey, string>>({
//     headline: "", about: "", experience: "", projects: "",
//     education: "", skills: "", certifications: "", banner: "",
//   });

//   const [approved, setApproved] = useState<Record<SectionKey, boolean>>({
//     headline: false, about: false, experience: false, projects: false,
//     education: false, skills: false, certifications: false, banner: false,
//   });

//   const [regenCount, setRegenCount] = useState<Record<SectionKey, number>>({
//     headline: 0, about: 0, experience: 0, projects: 0,
//     education: 0, skills: 0, certifications: 0, banner: 0,
//   });

//   // Viewer modal
//   const [viewerOpen, setViewerOpen] = useState(false);
//   const [viewerSection, setViewerSection] = useState<SectionKey | null>(null);
//   const step = STEPS[stepIndex];

//   function openViewer(forSection: SectionKey) {
//     setViewerSection(forSection);
//     setViewerOpen(true);
//   }
//   function closeViewer() {
//     setViewerOpen(false);
//     setViewerSection(null);
//   }

//   /* ====================== GENERATION CORE ====================== */
//   async function callGenerator(
//     section: SectionKey,
//     avoidText: string,
//     variation: number,
//   ) {
//     const nonce = Math.random().toString(36).slice(2);
//     let attempt = 0;
//     const maxAttempts = 2;

//     while (true) {
//       const res = await fetch("/api/generate-section", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           section,
//           targetRole,                  // optional for experience
//           resumeText,                  // single-shot: whole resume
//           jobDescription,
//           industry: industry || "",
//           variation,
//           avoidText,
//           nonce,
//           keywords,
//         }),
//       });

//       const text = await res.text();
//       let data: any = {};
//       try { data = JSON.parse(text); } catch {}

//       if (res.ok) return (data?.text as string) ?? (data?.content as string) ?? "";

//       const msg = data?.error || text || `HTTP ${res.status}`;
//       if (res.status === 429 || /quota|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg)) {
//         if (attempt < maxAttempts) {
//           attempt += 1;
//           await new Promise(r => setTimeout(r, 1500 * attempt));
//           continue;
//         }
       
// throw new Error(msg || "OpenAI error. Check plan/billing, try a smaller model, or try again.");

//       }
//       throw new Error(msg);
//     }
//   }

//   // All sections (including experience) now follow the same flow
//   async function generate(section: SectionKey) {
//   // show spinner for this section
//   setGenerating((g: any) => ({ ...g, [section]: true }));

//   try {
//     // previous content (if any) for this exact section
//     const prev = outputs?.[section] ?? "";
//     const nextVariation = (regenCount?.[section] ?? 0) + 1;

//     // build the same payload you were sending in callGenerator
//     const payload = {
//       section,
//       targetRole,          // already in scope in this component
//       resumeText,          // already in scope in this component
//       jobDescription,      // already in scope in this component
//       industry,            // already in scope in this component
//       keywords,            // already in scope in this component
//       variation: nextVariation,
//       avoidText,           // already in scope in this component
//       // If you later expose subIndex/roleContext, you can add:
//       // subIndex: currentRoleIndex,
//       // roleContext: roleCtx,
//       // mode,                // if you need to force model selection, else omit
//       // modelOverride,       // if you expose it in your UI, else omit
//     };

//     // ask for a new variation; this will NEVER throw for “not different”
//     const { content } = await generateWithVariation(
//       payload,
//       prev ? [prev] : []   // compare against current content only
//     );

//     // update UI with the returned content
//     setOutputs((o: any) => ({ ...o, [section]: content }));
//     setRegenCount((c: any) => ({ ...c, [section]: nextVariation }));
//   } catch (err: any) {
//     // real errors (network, 401/429, etc.) still surface here
//     setError(err?.message || "Generation failed");
//     console.error(err);
//   } finally {
//     setGenerating((g: any) => ({ ...g, [section]: false }));
//   }
// }


//   function approveAndNext() {
//     const k = step.key;
//     if (!outputs[k]?.trim()) return;

//     // No special combine logic for experience anymore
//     setApproved((a) => ({ ...a, [k]: true }));

//     if (stepIndex >= STEPS.length - 1) {
//       const payload = {
//         meta: {
//           targetRole,
//           jobDescription,
//           industry: industry || "",
//           generatedAt: new Date().toISOString(),
//           keywords,
//         },
//         sections: { ...outputs },
//         resumeText,
//       };
//       try { localStorage.setItem("applywizz_final", JSON.stringify(payload)); } catch {}
//       router.push("/final");
//       return;
//     }

//     setStepIndex(stepIndex + 1);
//   }

//   function prev() {
//     if (stepIndex > 0) setStepIndex(stepIndex - 1);
//   }

//   return (
//     <>
//       <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 border rounded-xl p-4 bg-white">
//           <h3 className="font-bold mb-3">LinkedIn Optimizer</h3>
//           <ol className="space-y-2 text-sm">
//             {STEPS.map((s, i) => {
//               const isCurrent = i === stepIndex;
//               const isApproved = approved[s.key];
//               const canView = isApproved && (outputs[s.key]?.trim()?.length ?? 0) > 0;

//               return (
//                 <li key={s.key} className={`flex items-center justify-between gap-2 ${isCurrent ? "font-semibold" : ""}`}>
//                   <div className="flex items-center gap-2">
//                     <span className={`inline-block w-5 h-5 rounded-full text-center text-xs ${
//                       isApproved ? "bg-green-600 text-white" : isCurrent ? "bg-blue-600 text-white" : "bg-gray-200"
//                     }`}>
//                       {isApproved ? "✓" : i + 1}
//                     </span>
//                     <span>{s.title}</span>
//                   </div>

//                   {canView && (
//                     <button
//                       onClick={() => { setViewerSection(s.key); setViewerOpen(true); }}
//                       className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
//                       title="View approved content"
//                     >
//                       View
//                     </button>
//                   )}
//                 </li>
//               );
//             })}
//           </ol>

//           <div className="mt-4 text-xs text-gray-500">
//             {step.helper}
//           </div>
//         </aside>

//         {/* Main panel */}
//         <section className="lg:col-span-4 border rounded-xl p-4 bg-white">
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-lg font-bold">{STEPS[stepIndex].title}</h2>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => generate(step.key)}
//                 disabled={busy}
//                 className="px-3 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
//                 title="Regenerate will try to produce a different variation (up to 8 attempts)"
//               >
//                 {outputs[step.key] ? "Regenerate" : "Generate"}
//               </button>
//               <button
//                 onClick={approveAndNext}
//                 disabled={busy || !outputs[step.key]}
//                 className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
//               >
//                 Approve & Next
//               </button>
//             </div>
//           </div>

//           {busy && <p className="text-blue-600">Generating…</p>}
//           {error && (
//             <pre className="mt-3 whitespace-pre-wrap text-red-700 bg-red-50 border border-red-200 p-3 rounded">{error}</pre>
//           )}

//           {!outputs[step.key] && !busy && !error && (
//             <p className="text-gray-600">Click <b>Generate</b> to create this section.</p>
//           )}

//           {/* All steps (including Experience): single textarea editor */}
//           {outputs[step.key] && (
//             <div className="mt-3">
//               <textarea
//                 value={outputs[step.key]}
//                 onChange={(e) => setOutputs((o) => ({ ...o, [step.key]: e.target.value }))}
//                 className="w-full min-h-60 max-h-[60vh] h-72 resize-y border rounded p-3 text-sm"
//               />
//             </div>
//           )}

//           <div className="mt-4 flex items-center justify-between">
//             <button
//               onClick={prev}
//               disabled={busy || stepIndex === 0}
//               className="px-3 py-2 rounded border disabled:opacity-50"
//             >
//               Back
//             </button>
//             <div className="text-xs text-gray-500">
//               {approved[step.key]
//                 ? (stepIndex === STEPS.length - 1 ? "Approved — Finishing…" : "Approved")
//                 : "Awaiting approval"}
//             </div>
//           </div>
//         </section>
//       </div>

//       {/* Scrollable MODAL for "View" */}
//       {viewerOpen && viewerSection && (
//         <div className="fixed inset-0 z-50">
//           {/* Backdrop */}
//           <div className="absolute inset-0 bg-black/40" onClick={closeViewer} />
//           {/* Modal container */}
//           <div className="absolute inset-x-0 top-[6%] mx-auto w-[95%] max-w-3xl">
//             <div className="bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
//               {/* Sticky header */}
//               <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0">
//                 <h3 className="font-semibold">{titleForStep(viewerSection!)}</h3>
//                 <button
//                   onClick={closeViewer}
//                   className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//               {/* Scrollable content */}
//               <div className="p-4 overflow-auto">
//                 <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-3 overflow-auto">
// {outputs[viewerSection!]}
//                 </pre>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
// components/optimizer-wizard.tsx
// components/optimizer-wizard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedResume } from "@/lib/resumeParser";
import { generateWithVariation } from "@/lib/generateSection";
import ApplyWizzLoader from "@/components/ApplyWizzLoader";

type SectionKey =
  | "headline"
  | "about"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "certifications";

const STEPS: { key: SectionKey; title: string; helper: string }[] = [
  { key: "headline",       title: "1) Headline",        helper: "Concise, keyword-rich headline under 220 chars." },
  { key: "about",          title: "2) About",           helper: "3 short paragraphs: intro, achievements, closing." },
  { key: "experience",     title: "3) Experience",      helper: "Full Experience section (all companies), outcome-focused bullets." },
  { key: "projects",       title: "4) Projects",        helper: "2–4 key projects; quantified results." },
  { key: "education",      title: "5) Education",       helper: "Reverse-chronological; relevant coursework." },
  { key: "skills",         title: "6) Skills",          helper: "30–35 skills, grouped, top 10 bolded." },
  { key: "certifications", title: "7) Certifications",  helper: "Max 6; from resume only." },
];

interface WizardProps {
  resumeText: string;
  parsed: ParsedResume | null;
  targetRole: string;
  jobDescription: string;
  industry?: string;
  keywords?: string[];
}

function titleForStep(key: SectionKey) {
  return STEPS.find((s) => s.key === key)?.title.replace(/^\d+\)\s*/, "") || key;
}

export default function OptimizerWizard({
  resumeText,
  parsed, // eslint-disable-line @typescript-eslint/no-unused-vars
  targetRole,
  jobDescription,
  industry,
  keywords = [],
}: WizardProps) {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [generating, setGenerating] = useState<Record<SectionKey, boolean>>({
    headline: false, about: false, experience: false, projects: false,
    education: false, skills: false, certifications: false,
  });

  const [outputs, setOutputs] = useState<Record<SectionKey, string>>({
    headline: "", about: "", experience: "", projects: "",
    education: "", skills: "", certifications: "",
  });

  const [approved, setApproved] = useState<Record<SectionKey, boolean>>({
    headline: false, about: false, experience: false, projects: false,
    education: false, skills: false, certifications: false,
  });

  const [regenCount, setRegenCount] = useState<Record<SectionKey, number>>({
    headline: 0, about: 0, experience: 0, projects: 0,
    education: 0, skills: 0, certifications: 0,
  });

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

  async function generate(section: SectionKey) {
    setGenerating((g) => ({ ...g, [section]: true }));
    setError(null);

    try {
      const prev = outputs?.[section] ?? "";
      const nextVariation = (regenCount?.[section] ?? 0) + 1;

      const payload = {
        section,
        targetRole,
        resumeText,
        jobDescription,
        industry,
        keywords,
        variation: nextVariation,
      };

      const { content } = await generateWithVariation(payload, prev ? [prev] : []);
      if (!content?.trim()) throw new Error("No content returned for this section.");

      setOutputs((o) => ({ ...o, [section]: content }));
      setRegenCount((c) => ({ ...c, [section]: nextVariation }));
    } catch (err: any) {
      setError(err?.message || "Generation failed");
      console.error(err);
    } finally {
      setGenerating((g) => ({ ...g, [section]: false }));
    }
  }

  function approveAndNext() {
    const currentKey = step.key;
    if (!outputs[currentKey]?.trim()) return;

    setApproved((a) => ({ ...a, [currentKey]: true }));

    // If last step, finish
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

    // Move to next step and auto-generate that section if empty
    const nextIdx = stepIndex + 1;
    const nextKey = STEPS[nextIdx].key;

    setStepIndex(nextIdx);

    // IMPORTANT: only auto-generate if this next section is empty
    if (!(outputs[nextKey]?.trim())) {
      // Allow React to commit step change, then trigger generate for the next section
      setTimeout(() => generate(nextKey), 0);
    }
  }

  function prev() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  const isGenerating = !!generating[step.key];

  return (
    <>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 border rounded-xl p-4 bg-white">
          <h3 className="font-bold mb-3">LinkedIn Optimizer</h3>

          {/* --- compact, tidy list --- */}
          <ol className="space-y-1 text-sm">
  {STEPS.map((s, i) => {
    const isCurrent  = i === stepIndex;
    const isApproved = approved[s.key];
    const canView    = isApproved && (outputs[s.key]?.trim()?.length ?? 0) > 0;

    return (
      <li
        key={s.key}
        className={`grid grid-cols-[1fr,auto] items-center gap-2 rounded-md px-1 py-1.5 ${
          isCurrent ? "bg-slate-50 font-semibold" : ""
        }`}
      >
        {/* LEFT: badge + title on ONE line, never break between them */}
        <div className="inline-flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${
              isApproved
                ? "bg-green-600 text-white"
                : isCurrent
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-800"
            }`}
          >
            {isApproved ? "✓" : i + 1}
          </span>
          {/* keep the title on the same line; ellipsis if too long */}
          <span className="truncate whitespace-nowrap">
            {titleForStep(s.key)}
          </span>
        </div>

        {/* RIGHT: compact View button */}
        {canView && (
          <button
            onClick={() => openViewer(s.key)}
            className="hidden sm:inline-flex px-2 py-1 text-[11px] rounded border hover:bg-gray-50 whitespace-nowrap"
            title="View approved content"
          >
            View
          </button>
        )}
      </li>
    );
  })}
</ol>

          <div className="mt-3 text-[11px] leading-snug text-gray-500">{step.helper}</div>
        </aside>

        {/* Main panel */}
        <section className="lg:col-span-4 border rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{titleForStep(step.key)}</h2>

            <div className="flex gap-2">
              <button
                onClick={() => generate(step.key)}
                disabled={isGenerating}
                className="px-3 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
                title="Regenerate will try to produce a different variation"
              >
                {isGenerating ? "Generating..." : outputs[step.key] ? "Regenerate" : "Generate"}
              </button>
              <button
                onClick={approveAndNext}
                disabled={isGenerating || !outputs[step.key]}
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                Approve & Next
              </button>
            </div>
          </div>

          {/* Integrated content well (unchanged) */}
          <div
            className={`mt-3 rounded-xl border bg-slate-50/60 min-h-[400px] ${
              isGenerating ? "flex items-center justify-center p-10" : "p-0"
            }`}
          >
            {error ? (
              <pre className="m-6 whitespace-pre-wrap text-red-700 bg-red-50 border border-red-200 p-3 rounded max-w-[720px] w-full">
                {error}
              </pre>
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-5">
                <ApplyWizzLoader size={200} />
                <span className="text-base text-slate-600">
                  Optimising your {titleForStep(step.key).toLowerCase()}…
                </span>
              </div>
            ) : outputs[step.key] ? (
              <textarea
                value={outputs[step.key]}
                onChange={(e) => setOutputs((o) => ({ ...o, [step.key]: e.target.value }))}
                className="block w-full h-[400px] min-h-[360px] resize-y bg-transparent border-0 outline-none focus:ring-0 p-6 text-sm"
              />
            ) : (
              <div className="p-6">
                <p className="text-gray-600">
                  Click <b>Generate</b> to create this section.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={isGenerating || stepIndex === 0}
              className="px-3 py-2 rounded border disabled:opacity-50"
            >
              Back
            </button>
            <div className="text-xs text-gray-500">
              {approved[step.key]
                ? stepIndex === STEPS.length - 1
                  ? "Approved — Finishing…"
                  : "Approved"
                : "Awaiting approval"}
            </div>
          </div>
        </section>
      </div>

      {/* Viewer Modal */}
      {viewerOpen && viewerSection && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeViewer} />
          <div className="absolute inset-x-0 top-[6%] mx-auto w-[95%] max-w-3xl">
            <div className="bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
              <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0">
                <h3 className="font-semibold">{titleForStep(viewerSection!)}</h3>
                <button onClick={closeViewer} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">
                  Close
                </button>
              </div>
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



