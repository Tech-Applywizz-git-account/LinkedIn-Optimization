// Replace the entire component with this updated version
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Define types
type ExperienceInput = {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  start?: string;
  end?: string;
  bullets?: string[];
  raw?: string;
  targetRole: string;
  resumeText: string;
  jobDescriptionText: string;
};

type ItemState = {
  status: "idle" | "generating" | "generated" | "approved" | "error";
  output?: string;
  error?: string;
};

type Props = {
  experiences: ExperienceInput[];
  genEndpoint?: string;
  section?: "experience" | "internship";
};

// Enhanced company normalization (matches backend)
const COMPANY_STOPWORDS = [
  "private limited", "pvt ltd", "pvt. ltd.", "pvt limited", "private ltd",
  "limited", "ltd", "inc", "llc", "llp", "co.", "co", "corp.", "corp", "corporation",
  "technologies", "technology", "solutions", "systems", "software", "services",
  "india", "india pvt ltd", "pvt", "plc", "gmbh"
];

function normCompany(v?: string): string {
  if (!v) return "";
  let k = v.toLowerCase().trim();
  k = k.replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  
  for (const sw of COMPANY_STOPWORDS) {
    const rx = new RegExp(`\\b${sw}\\b`, "g");
    k = k.replace(rx, " ");
  }
  
  return k.replace(/\s+/g, " ").trim();
}

// Month parsing helpers
const MONTH_MAP = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 } as const;
type MonthAbbrev = keyof typeof MONTH_MAP;

function monthKey(raw?: string): number | undefined {
  const str = (raw || "").trim();
  if (!str) return undefined;
  if (/^(present|current)$/i.test(str)) return 999999;
  
  const m1 = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (m1) return parseInt(m1[2], 10) * 100 + Math.max(1, Math.min(12, parseInt(m1[1], 10)));
  
  const m2 = str.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})$/i);
  if (m2) {
    const month = m2[1].slice(0, 3).toLowerCase() as MonthAbbrev;
    return parseInt(m2[2], 10) * 100 + (MONTH_MAP[month] || 1);
  }
  
  const m3 = str.match(/^(\d{4})$/);
  if (m3) return parseInt(m3[1], 10) * 100 + 1;
  
  return undefined;
}

// Group experiences by company (matches backend logic)
function groupExperiencesByCompany(experiences: ExperienceInput[]) {
  const grouped = new Map<string, ExperienceInput[]>();
  
  for (const exp of experiences) {
    const companyKey = normCompany(exp.company);
    if (!grouped.has(companyKey)) {
      grouped.set(companyKey, []);
    }
    grouped.get(companyKey)?.push(exp);
  }
  
  return grouped;
}

// Main Component
export default function StepwiseExperience({
  experiences,
  genEndpoint = "/api/generate-section",
  section = "experience",
}: Props) {
  // Group experiences by company for button generation
  const groupedExperiences = useMemo(() => 
    groupExperiencesByCompany(experiences), [experiences]);
  
  // Flatten for individual processing
  const flatExperiences = useMemo(() => 
    Array.from(groupedExperiences.values()).flat(), [groupedExperiences]);
  
  const [states, setStates] = useState<ItemState[]>(() => 
    flatExperiences.map(() => ({ status: "idle" })));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const regenRef = useRef<number[]>(flatExperiences.map(() => 0));

  useEffect(() => {
    setStates(prev => flatExperiences.map((_, i) => prev[i] ?? { status: "idle" }));
  }, [flatExperiences.length]);

  const currentExp = flatExperiences[currentIndex];
  const currentState = states[currentIndex];

  const setStateAt = (index: number, next: Partial<ItemState>) => {
    setStates(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...next };
      return copy;
    });
  };

  const generate = useCallback(async () => {
    if (!currentExp) return;
    setStateAt(currentIndex, { status: "generating", error: undefined });

    const avoidText = states
      .map((s, i) => (i !== currentIndex ? s.output : ""))
      .filter(Boolean)
      .join("\n\n");

    const roleContext = {
      title: currentExp.title || "",
      company: currentExp.company || "",
      location: currentExp.location || "",
      start: currentExp.start || "",
      end: currentExp.end || "",
      bullets: Array.isArray(currentExp.bullets) ? currentExp.bullets.slice(0, 6) : [],
      raw: currentExp.raw || "",
    };

    const nextVar = (regenRef.current[currentIndex] || 0) + 
                   (states[currentIndex]?.status === "generated" ? 1 : 0);
    regenRef.current[currentIndex] = nextVar;

    try {
      const res = await fetch(genEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section, 
          targetRole: currentExp.targetRole,
          resumeText: currentExp.resumeText,
          jobDescription: currentExp.jobDescriptionText,
          industry: "", 
          variation: nextVar,
          avoidText, 
          nonce: Math.random().toString(36).slice(2),
          subIndex: currentIndex, 
          roleContext,
        }),
      });

      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      
      const json = await res.json();
      setStateAt(currentIndex, { status: "generated", output: json.content });
    } catch (err: any) {
      setStateAt(currentIndex, { status: "error", error: err?.message || "Failed" });
    }
  }, [currentExp, currentIndex, genEndpoint, section, states]);

  const approveAndNext = useCallback(() => {
    setStateAt(currentIndex, { status: "approved" });
    if (currentIndex < flatExperiences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, flatExperiences.length]);

  const back = useCallback(() => 
    setCurrentIndex(i => Math.max(0, i - 1)), []);
  
  const skip = useCallback(() => 
    setCurrentIndex(i => Math.min(flatExperiences.length - 1, i + 1)), 
    [flatExperiences.length]);

  if (flatExperiences.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm text-gray-600">No experience items detected.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {section === "internship" ? "Internship Generator" : "Experience Generator"}
        </h3>
        <span className="text-xs text-gray-600">
          Step {currentIndex + 1} of {flatExperiences.length}
        </span>
      </div>

      {/* Experience buttons by company */}
      <div className="flex flex-wrap gap-2">
        {Array.from(groupedExperiences.entries()).map(([companyKey, companyExps]) => (
          <button
            key={companyKey}
            className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm"
            onClick={() => {
              const firstIndex = flatExperiences.findIndex(exp => 
                normCompany(exp.company) === companyKey);
              if (firstIndex !== -1) setCurrentIndex(firstIndex);
            }}
          >
            {companyExps[0]?.company || "Unknown Company"} ({companyExps.length} role{companyExps.length > 1 ? 's' : ''})
          </button>
        ))}
      </div>

      {/* Current experience item */}
      <div className="rounded-lg border p-4">
        <div className="mb-2">
          <div className="text-sm font-medium">
            {(currentExp.title ? `${currentExp.title}` : `Experience ${currentIndex + 1}`) +
              (currentExp.company ? ` — ${currentExp.company}` : "")}
          </div>
          <div className="text-xs text-gray-500">
            {currentExp.location ? `${currentExp.location} | ` : ""}
            {currentExp.start || currentExp.end ? 
              `${currentExp.start || ""}${currentExp.start && currentExp.end ? " - " : ""}${currentExp.end || ""}` : ""}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {currentState?.status !== "generating" && (
            <button onClick={generate} className="rounded-md bg-black px-3 py-2 text-white">
              {currentState?.status === "generated" ? "Regenerate" : "Generate"}
            </button>
          )}
          {currentState?.status === "generating" && (
            <button disabled className="cursor-wait rounded-md bg-gray-800 px-3 py-2 text-white">
              Generating…
            </button>
          )}
          {currentState?.status === "generated" && (
            <button onClick={approveAndNext} className="rounded-md bg-emerald-600 px-3 py-2 text-white">
              Approve & Next
            </button>
          )}
          {currentState?.status === "error" && (
            <span className="text-sm text-red-600">{currentState.error}</span>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={back} disabled={currentIndex === 0} 
              className="rounded-md border px-3 py-2 disabled:opacity-50">
              Back
            </button>
            <button onClick={skip} disabled={currentIndex === flatExperiences.length - 1} 
              className="rounded-md border px-3 py-2 disabled:opacity-50">
              Skip
            </button>
          </div>
        </div>

        <div className="rounded-md border bg-white p-3">
          {!currentState?.output && currentState?.status !== "generating" && (
            <div className="text-sm text-gray-600">Click Generate to create this role.</div>
          )}
          {!!currentState?.output && (
            <pre className="whitespace-pre-wrap text-sm leading-6">{currentState.output}</pre>
          )}
        </div>
      </div>
    </div>
  );
}