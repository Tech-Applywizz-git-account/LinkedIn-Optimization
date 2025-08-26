// components/minimalstepwrapper.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ParsedResume } from "@/lib/resumeParser";
import OptimizerWizard from "@/components/optimizer-wizard";

type Props = {
  resumeText: string;
  parsed: ParsedResume | null;
  targetRole: string;
  jobDescription: string;
  industry: string;
  genEndpoint?: string;
};

type Item = {
  id: string;
  label: string;
  target: string;
  kind: "experience" | "internship";
};

const s = (v: unknown): string => (v == null ? "" : String(v).trim());

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
} as const;
type MonthAbbrev = keyof typeof MONTH_MAP;

function normalizeMonthAbbrev(input: string): MonthAbbrev | null {
  const key = input.slice(0, 3).toLowerCase();
  return (key in MONTH_MAP ? (key as MonthAbbrev) : null);
}
function monthKey(raw: unknown): number | undefined {
  const str = s(raw);
  if (!str) return undefined;
  if (/^(present|current)$/i.test(str)) return 999999;
  const m1 = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (m1) {
    const mm = Math.max(1, Math.min(12, parseInt(m1[1], 10)));
    const yy = parseInt(m1[2], 10);
    return yy * 100 + mm;
  }
  const m2 = str.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})$/i);
  if (m2) {
    const abbr = normalizeMonthAbbrev(m2[1]);
    const yy = parseInt(m2[2], 10);
    const mm = abbr ? MONTH_MAP[abbr] : 1;
    return yy * 100 + mm;
  }
  const m3 = str.match(/^(\d{4})$/);
  if (m3) {
    const yy = parseInt(m3[1], 10);
    return yy * 100 + 1;
  }
  return undefined;
}

function renderMonthKey(n?: number): string {
  if (n === undefined) return "";
  if (n === 999999) return "Present";
  const yy = Math.floor(n / 100);
  const mm = n % 100;
  const NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
  return `${NAMES[Math.max(1, Math.min(12, mm)) - 1]} ${yy}`;
}

const normCompany = (v: unknown) =>
  s(v).toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();

const richer = (a: any, b: any) =>
  (s(a?.raw).length + (Array.isArray(a?.bullets) ? a.bullets.length : 0)) >=
  (s(b?.raw).length + (Array.isArray(b?.bullets) ? b.bullets.length : 0));

/** SAFE dedupe: if any date missing, include title+location in the key */
function dedupeByCompanyDates(list: any[]): any[] {
  const map = new Map<string, any>();
  for (const it of list || []) {
    const comp = normCompany(it?.company);
    const ks = monthKey(it?.start);
    const ke = monthKey(it?.end);

    const key =
      (ks === undefined || ke === undefined)
        ? `${comp}|${s(it?.title).toLowerCase()}|${s(it?.location).toLowerCase()}`
        : `${comp}|${ks}|${ke}`;

    const prev = map.get(key);
    if (!prev || !richer(prev, it)) {
      map.set(key, { ...it });
    }
  }
  return Array.from(map.values());
}

function mergeAdjacentSameCompany(list: any[]): any[] {
  if (!Array.isArray(list) || !list.length) return [];
  const out: any[] = [];
  for (const curr of list) {
    const prev = out[out.length - 1];
    if (prev && normCompany(prev.company) === normCompany(curr.company)) {
      const sPrev = monthKey(prev.start);
      const sCurr = monthKey(curr.start);
      const ePrev = monthKey(prev.end);
      const eCurr = monthKey(curr.end);
      const newStart = sPrev === undefined ? sCurr : sCurr === undefined ? sPrev : Math.min(sPrev, sCurr);
      const newEnd = ePrev === undefined ? eCurr : eCurr === undefined ? ePrev : Math.max(ePrev, eCurr);
      prev.start = renderMonthKey(newStart) || prev.start || curr.start;
      prev.end = renderMonthKey(newEnd) || prev.end || curr.end;

      if (!s(prev.title) && s(curr.title)) prev.title = s(curr.title);
      if (!s(prev.location) && s(curr.location)) prev.location = s(curr.location);

      const seen = new Set<string>((prev.bullets || []).map((b: any) => s(b)));
      for (const b of (curr.bullets || [])) {
        const k = s(b);
        if (k && !seen.has(k)) {
          (prev.bullets = prev.bullets || []).push(k);
          seen.add(k);
        }
      }
      prev.raw = s(prev.raw) + (s(curr.raw) ? `\n\n${s(curr.raw)}` : "");
    } else {
      out.push({ ...curr });
    }
  }
  return out;
}

function forceShape(it: any) {
  return {
    title: s(it?.title || it?.role || it?.position || ""),
    company: s(it?.company || ""),
    location: s(it?.location || ""),
    start: s(it?.start || ""),
    end: s(it?.end || ""),
    bullets: Array.isArray(it?.bullets) ? it.bullets.map((b: any) => s(b)) : [],
    raw: s(it?.raw || ""),
  };
}

function sanitizeRoles(list: any[]): any[] {
  const forced = (list || []).map(forceShape).filter((x) => x.company || x.title);
  const merged = mergeAdjacentSameCompany(forced);
  const deduped = dedupeByCompanyDates(merged);
  return deduped;
}

export default function MinimalStepWrapper({
  resumeText,
  parsed,
  targetRole,
  jobDescription,
  industry,
  genEndpoint,
}: Props) {
  const parsedClean = useMemo(() => {
    const experiencesArr = sanitizeRoles((parsed as any)?.experiences || []);
    const internshipsArr = sanitizeRoles((parsed as any)?.internships || []);
    return {
      ...(parsed || {}),
      experiences: experiencesArr,
      internships: internshipsArr,
    } as ParsedResume;
  }, [parsed]);

  const items = useMemo<Item[]>(() => {
    const internships = (parsedClean as any)?.internships || [];
    const experiences = (parsedClean as any)?.experiences || [];

    const internItems: Item[] = internships.map((it: any, i: number) => {
      const title = s(it?.title || "Internship");
      const company = s(it?.company);
      const label = company ? `${title} — ${company}` : title;
      const target = s(targetRole || it?.title || "");
      return { id: `intern-${i + 1}`, label, target, kind: "internship" as const };
    });

    const expItems: Item[] = experiences.map((exp: any, i: number) => {
      const title = s(exp?.title || "Experience");
      const company = s(exp?.company);
      const label = company ? `${title} — ${company}` : title;
      const target = s(targetRole || exp?.title || "");
      return { id: `exp-${i + 1}`, label, target, kind: "experience" as const };
    });

    const seen = new Set<string>();
    return [...internItems, ...expItems].filter((it) => {
      const key = `${it.kind}::${it.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [parsedClean, targetRole]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index > items.length - 1) setIndex(0);
  }, [items.length, index]);

  const current = items[index];
  const Wizard: any = OptimizerWizard;

  return (
    <div className="space-y-3">
      <Wizard
        resumeText={s(resumeText)}
        parsed={parsedClean}
        targetRole={s(current?.target || targetRole)}
        jobDescription={s(jobDescription)}
        industry={s(industry)}
        genEndpoint={genEndpoint}
        section={current?.kind ?? "experience"}
        stepLabel={s(current?.label)}
        stepIndex={index}
      />
    </div>
  );
}
