"use client";

import { useEffect, useMemo, useState } from "react";

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
   
  };
  resumeText?: string;
};

export default function FinalPage() {
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("applywizz_final");
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  const md = useMemo(() => {
    if (!payload) return "";
    const { meta, sections } = payload;
    return [
      `# LinkedIn Optimization — Final Draft`,
      ``,
      `**Target Role:** ${meta.targetRole}`,
      `**Industry:** ${meta.industry}`,
      `**Generated:** ${new Date(meta.generatedAt).toLocaleString()}`,
      ``,
      `## Headline`,
      sections.headline?.trim() || "",
      ``,
      `## About`,
      sections.about?.trim() || "",
      ``,
      `## Experience`,
      sections.experience?.trim() || "",
      ``,
      `## Projects`,
      sections.projects?.trim() || "",
      ``,
      `## Education`,
      sections.education?.trim() || "",
      ``,
      `## Skills`,
      sections.skills?.trim() || "",
      ``,
      `## Certifications`,
      sections.certifications?.trim() || "",
     
    ].join("\n");
  }, [payload]);

  function copyAll() {
    if (!md) return;
    navigator.clipboard.writeText(md).catch(() => {});
  }

  function downloadMd() {
    if (!md) return;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applywizz_linkedin_final.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!payload) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Final Review</h1>
        <p className="text-red-600">
          No data found. Please complete the 8-step wizard and approve the last step.
        </p>
      </main>
    );
  }

  const { meta, sections } = payload;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Final Review</h1>
          <p className="text-sm text-gray-600">
            Target Role: <b>{meta.targetRole}</b> · Industry: <b>{meta.industry}</b> · Generated:{" "}
            {new Date(meta.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyAll} className="px-3 py-2 rounded border">Copy All</button>
          <button onClick={downloadMd} className="px-3 py-2 rounded border">Download .md</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded border">Print</button>
        </div>
      </header>

      <section className="bg-white border rounded-xl p-5 space-y-6">
        <Block title="Headline" text={sections.headline} />
        <Block title="About" text={sections.about} />
        <Block title="Experience" text={sections.experience} markdown />
        <Block title="Projects" text={sections.projects} markdown />
        <Block title="Education" text={sections.education} markdown />
        <Block title="Skills" text={sections.skills} />
        <Block title="Certifications" text={sections.certifications} />
          
      </section>
    </main>
  );
}

function Block({ title, text, markdown = false }: { title: string; text: string; markdown?: boolean }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {markdown ? (
        <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50">{text}</pre>
      ) : (
        <div className="text-sm whitespace-pre-wrap border rounded p-3 bg-gray-50">{text}</div>
      )}
    </div>
  );
}
