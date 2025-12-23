"use client";

import { useMemo, useState } from "react";
import { generateProfile } from "@/lib/optimization-engine";
import type { ParsedResume } from "@/lib/resumeParser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Props {
  resume: ParsedResume | null;
}

export default function OptimizationWorkflow({ resume }: Props) {
  const [targetRole, setTargetRole] = useState("Data Engineer");
  const [industry, setIndustry] = useState("Technology");
  const [domain, setDomain] = useState("ETL, Data Warehousing, Apache Spark, Airflow, AWS");
  const [jd, setJd] = useState("");

  const [out, setOut] = useState<ReturnType<typeof generateProfile> | null>(null);

  const domainKeywords = useMemo(
    () => domain.split(",").map(s => s.trim()).filter(Boolean),
    [domain]
  );

  const onGenerate = () => {
    if (!resume) return;
    setOut(
      generateProfile({
        targetRole,
        resume,
        domainKeywords,
        jobDescriptionText: jd,
        industry
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Role</label>
          <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Industry</label>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Domain Keywords (comma separated)</label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g., AML, KYC, BSA" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Job Description (optional)</label>
          <Textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={6} />
        </div>
      </div>

      <Button onClick={onGenerate} disabled={!resume}>Generate Optimized Profile</Button>

      {out && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <CardBlock title="HEADLINE" body={`- ${out.headline}`} />
          <CardBlock title="ABOUT" body={out.about} />
          <CardBlock title="EXPERIENCE" body={out.experience} />
          <CardBlock title="PROJECTS" body={out.projects} />
          <CardBlock title="SKILLS" body={out.skills} />
          <CardBlock title="EDUCATION" body={out.education} />
          <CardBlock title="CERTIFICATIONS" body={out.certifications} />
          {/* <CardBlock
            title="BANNER"
            body={[
              "Concepts:",
              ...out.banner.concepts.map((c, i) => `${i + 1}. ${c}`),
              "",
              "AI Prompts:",
              ...out.banner.aiPrompts.map((p, i) => `${i + 1}. ${p}`)
            ].join("\n")}
          /> */}
        </div>
      )}
    </div>
  );
}

function CardBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border p-4 bg-white/70">
      <h4 className="font-semibold mb-2">{title}</h4>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{body}</pre>
    </div>
  );
}
