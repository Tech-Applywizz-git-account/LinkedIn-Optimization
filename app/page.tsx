"use client";

import { useState } from "react";
import ResumeUpload from "@/components/resume-upload";
import MinimalStepWrapper from "@/components/MinimalStepWrapper";
import type { ParsedResume } from "@/lib/resumeParser";
import { sanitizeLLMText } from "@/lib/sanitize";  // 👈 make sure this is imported

export default function Page() {
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [industry, setIndustry] = useState("");

  function handleParsed(data: { text: string; parsed: ParsedResume }) {
    setResumeText(sanitizeLLMText(data.text));   // 👈 use it here
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
              onChange={(e) => setTargetRole(sanitizeLLMText(e.target.value))}  // 👈 use it here
            />
          </label>

          {/* <label className="text-sm">
            Job Description
            <textarea
              className="mt-1 w-full border rounded p-2 h-32 placeholder-gray-400"
              value={jobDescription}
              onChange={(e) => setJobDescription(sanitizeLLMText(e.target.value))} // 👈 use it here
            />
          </label>

          <label className="text-sm">
            Industry
            <input
              className="mt-1 w-full border rounded p-2 placeholder-gray-400"
              value={industry}
              onChange={(e) => setIndustry(sanitizeLLMText(e.target.value))} // 👈 use it here
            />
          </label> */}
        </div>
      </section>

      {/* 3) Optimizer */}
      {resumeText ? (
        <section className="border rounded-xl p-4 bg-white">
          <h2 className="text-lg font-semibold mb-3">3) Generate Experience</h2>
          <MinimalStepWrapper
            resumeText={resumeText}
            parsed={parsed}
            targetRole={targetRole}
            jobDescription={jobDescription}
            industry={industry}
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
