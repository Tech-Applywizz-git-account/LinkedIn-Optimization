"use client";

import React, { useMemo, useState } from "react";
import type { ParsedResume } from "@/lib/resumeParser";
// IMPORTANT: adjust this import to match how OptimizerWizard is exported in your project.
// If OptimizerWizard is a default export, keep this line as-is.
// If it's a named export, change to: import { OptimizerWizard } from "@/components/optimizer-wizard";
import OptimizerWizard from "@/components/optimizer-wizard";

type Props = {
  resumeText: string;
  parsed: ParsedResume | null;
  targetRole: string;
  jobDescription: string;
  industry: string;
  genEndpoint?: string;
};

export default function MinimalStepWrapper({
  resumeText,
  parsed,
  targetRole,
  jobDescription,
  industry,
  genEndpoint,
}: Props) {
  const items = useMemo(() => {
    // If your parser exposes structured experiences, map them here.
    // Keep super-safe fallback to avoid UI changes.
    const parsedExperiences =
      
      parsed?.experiences?.map((exp: any, i: number) => ({
        id: `exp-${i + 1}`,
        label:
          (exp?.title || exp?.role || exp?.position || "Experience") +
          (exp?.company ? ` — ${exp.company}` : ""),
        target: targetRole || exp?.title || exp?.role || "",
      })) ?? [];

    if (parsedExperiences.length > 0) return parsedExperiences;

    return [
      { id: "exp-1", label: "Experience 1", target: targetRole || "" },
      { id: "exp-2", label: "Experience 2", target: targetRole || "" },
    ];
  }, [parsed, targetRole]);

  const [index, setIndex] = useState(0);
  const total = items.length;
  const isLast = index === total - 1;
  const current = items[index];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <div className="font-medium">{current?.label || `Experience ${index + 1}`}</div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="border rounded px-2 py-1 disabled:opacity-50"
          >
            Back
          </button>

          <button
            onClick={() => !isLast && setIndex((i) => i + 1)}
            className="bg-emerald-600 text-white rounded px-3 py-1"
            disabled={isLast}
          >
            Approve & Next
          </button>

          <button
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={isLast}
            className="border rounded px-2 py-1 disabled:opacity-50"
          >
            Skip
          </button>

          <span className="text-xs text-gray-600">
            Step {index + 1} of {total}
          </span>
        </div>
      </div>

      {/* Render your original OptimizerWizard unchanged */}
      <OptimizerWizard
        resumeText={resumeText}
        parsed={parsed}
        targetRole={current?.target ?? targetRole}
        jobDescription={jobDescription}
        industry={industry}
        // If your OptimizerWizard accepts a custom endpoint prop, pass it:
        // @ts-expect-error only if your wizard supports this prop
        genEndpoint={genEndpoint}
      />
    </div>
  );
}
