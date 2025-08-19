"use client";

import { useState } from "react";
import ResumeUpload from "@/components/resume-upload";
import MinimalStepWrapper from "@/components/MinimalStepWrapper"; // ✅ default import
import type { ParsedResume } from "@/lib/resumeParser";

export default function Page() {
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  // 🚫 start empty so placeholders show
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [industry, setIndustry] = useState("");

  function handleParsed(data: { text: string; parsed: ParsedResume }) {
    setResumeText(data.text);
    setParsed(data.parsed || null);
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">LinkedIn Optimization (ApplyWizz)</h1>

      {/* 1) Resume Upload */}
      <section className="border rounded-xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">1) Upload Resume</h2>
        <ResumeUpload onParsed={handleParsed} />
      </section>

      {/* 2) Target Inputs */}
      <section className="border rounded-xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">2) Target Inputs</h2>
        <div className="grid gap-3">
          <label className="text-sm">
            Target Role
            <input
              className="mt-1 w-full border rounded p-2 placeholder-gray-400"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Full Stack Developer, Data Analyst"
              aria-label="Target Role"
            />
          </label>

          <label className="text-sm">
            Job Description (paste text)
            <textarea
              className="mt-1 w-full border rounded p-2 h-32 placeholder-gray-400"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              aria-label="Job Description"
            />
          </label>

          <label className="text-sm">
            Industry
            <input
              className="mt-1 w-full border rounded p-2 placeholder-gray-400"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Software, FinTech, Healthcare"
              aria-label="Industry"
            />
          </label>
        </div>
      </section>

      {/* 3) Step-by-step wrapper around your existing wizard */}
      {resumeText ? (
        <section className="border rounded-xl p-4 bg-white">
          <h2 className="text-lg font-semibold mb-3">3) Generate Experience</h2>

          <MinimalStepWrapper
            resumeText={resumeText}
            parsed={parsed}
            targetRole={targetRole}
            jobDescription={jobDescription}
            industry={industry}
            // genEndpoint="/api/generate-section" // uncomment only if your OptimizerWizard supports this prop
          />
        </section>
      ) : (
        <div className="border rounded-xl p-4 bg-white text-gray-600">
          Upload a resume to unlock the optimizer wizard.
        </div>
      )}
    </main>
  );
}
