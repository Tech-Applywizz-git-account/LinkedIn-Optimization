// FILE: lib/experienceUtils.ts  (FULL FILE)
// Fixes: stronger company normalization, stricter internship detection,
// hard de-duplication so buttons match distinct companies only (multi-stints collapse),
// and consistent months/years math.

import type { ParsedResume } from "./resumeParser";

export type ExperienceInput = {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  start?: string;
  end?: string;
  bullets?: string[];
  raw?: string;

  // context for generator
  targetRole: string;
  resumeText: string;
  jobDescriptionText?: string;
};

type RawRole = {
  title?: string;
  company?: string;
  location?: string;
  start?: string;
  end?: string;
  bullets?: string[];
  raw?: string;
};

type GroupAgg = {
  companyKey: string;
  company: string;
  mostRecentTitle: string;
  location: string;
  minStart?: number;
  maxEnd?: number;
  monthsSum: number;
  bullets: string[];
  raw: string;
};

/* ---------------- tiny helpers ---------------- */
const s = (v: unknown) => (v == null ? "" : String(v).trim());

// Enhanced normalization: strip punct, common suffixes, multiple spaces, case
const COMPANY_STOPWORDS = [
  "private limited","pvt ltd","pvt. ltd.","pvt limited","private ltd",
  "limited","ltd","inc","llc","llp","co.","co","corp.","corp","corporation",
  "technologies","technology","solutions","systems","software","services",
  "india","india pvt ltd","pvt","plc","gmbh"
];
function normCompany(v: unknown): string {
  let k = s(v).toLowerCase();
  k = k.replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  // remove stopwords as whole words
  for (const sw of COMPANY_STOPWORDS) {
    const rx = new RegExp(`\\b${sw}\\b`, "g");
    k = k.replace(rx, " ");
  }
  k = k.replace(/\s+/g, " ").trim();
  return k;
}

const MONTH_MAP = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 } as const;
type MonthAbbrev = keyof typeof MONTH_MAP;
const monthAbbrev = (x: string): MonthAbbrev | null => {
  const k = x.slice(0, 3).toLowerCase();
  return (k in MONTH_MAP ? (k as MonthAbbrev) : null);
};

const looksLikeEducation = (it: RawRole) => {
  const t = s(it.title).toLowerCase();
  const c = s(it.company).toLowerCase();
  return /\b(b\.?tech|bachelor|master|ph\.?d|mba|b\.?e\.?|m\.?e\.?|university|college)\b/.test(t + " " + c);
};
const isInternTitle = (title?: string) =>
  /\b(intern|internship|trainee|apprentice|co[-\s]?op|industrial\s+trainee|graduate\s+trainee)\b/i.test(s(title));

const randId = () => Math.random().toString(36).slice(2, 9);

function renderMonthKey(key?: number) {
  if (key === undefined) return "";
  const y = Math.floor(key / 100);
  const m = key % 100;
  const names = ["", "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m >= 1 && m <= 12 ? `${names[m]} ${y}` : String(y);
}

function monthKey(v?: string): number | undefined {
  const t = s(v).toLowerCase();
  if (!t) return undefined;
  if (/\b(present|current)\b/.test(t)) {
    const d = new Date();
    return d.getFullYear() * 100 + (d.getMonth() + 1);
  }

  const m1 = t.match(/\b([a-z]{3,})\s+(\d{4})\b/);
  if (m1) {
    const mo = monthAbbrev(m1[1]);
    const yr = parseInt(m1[2], 10);
    if (mo) return yr * 100 + MONTH_MAP[mo];
  }
  const m3 = t.match(/\b(\d{1,2})[\/\-](\d{4})\b/);
  if (m3) {
    const mo = Math.max(1, Math.min(12, parseInt(m3[1], 10)));
    const yr = parseInt(m3[2], 10);
    return yr * 100 + mo;
  }
  const m2 = t.match(/\b(\d{4})\b/);
  if (m2) return parseInt(m2[1], 10) * 100 + 1;

  return undefined;
}

function monthsDiffInclusive(start?: number, end?: number): number {
  if (start === undefined && end === undefined) return 0;
  if (start === undefined) start = end;
  if (end === undefined) end = start;
  if (start === undefined || end === undefined) return 0;
  const sy = Math.floor(start / 100), sm = start % 100;
  const ey = Math.floor(end / 100), em = end % 100;
  return (ey - sy) * 12 + (em - sm) + 1; // inclusive
}

function mostCommonNonEmpty(values: string[]): string {
  const map = new Map<string, number>();
  for (const v of values.map(s).filter(Boolean)) {
    map.set(v, (map.get(v) || 0) + 1);
  }
  let best = "";
  let cnt = -1;
  for (const [v, n] of map) {
    if (n > cnt) { best = v; cnt = n; }
  }
  return best;
}

function aggInit(): GroupAgg {
  return {
    companyKey: "",
    company: "",
    mostRecentTitle: "",
    location: "",
    minStart: undefined,
    maxEnd: undefined,
    monthsSum: 0,
    bullets: [],
    raw: "",
  };
}

function aggregateCompany(roles: RawRole[], synthKey?: string): GroupAgg {
  const g = aggInit();
  g.companyKey = synthKey || normCompany(roles[0]?.company) || `__no_company__::${s(roles[0]?.title) || "unknown"}`;

  // dates & months sum
  let minS: number | undefined;
  let maxE: number | undefined;
  let months = 0;

  for (const it of roles) {
    const sKey = monthKey(it.start);
    const eKey = monthKey(it.end);
    if (sKey !== undefined) minS = minS === undefined ? sKey : Math.min(minS, sKey);
    if (eKey !== undefined) maxE = maxE === undefined ? eKey : Math.max(maxE, eKey);
    months += monthsDiffInclusive(sKey, eKey);

    // merge bullets (unique)
    const seen = new Set(g.bullets);
    for (const b of (Array.isArray(it.bullets) ? it.bullets : [])) {
      const v = s(b);
      if (v && !seen.has(v)) { g.bullets.push(v); seen.add(v); }
    }
    // raw merge
    const r = s(it.raw);
    if (r) g.raw = g.raw ? `${g.raw}\n${r}` : r;
  }

  g.minStart = minS;
  g.maxEnd = maxE;
  g.monthsSum = Math.max(0, months);

  // choose most recent title/location: pick from the role with max end (then max start)
  let best: RawRole | null = null;
  let bestEnd = -1, bestStart = -1;
  for (const it of roles) {
    const eKey = monthKey(it.end) ?? -1;
    const sKey = monthKey(it.start) ?? -1;
    if (eKey > bestEnd || (eKey === bestEnd && sKey > bestStart)) {
      best = it; bestEnd = eKey; bestStart = sKey;
    }
  }
  g.mostRecentTitle = s(best?.title);
  g.location = s(best?.location);

  // display company: most-common non-empty company string
  g.company = mostCommonNonEmpty(roles.map(r => s(r.company)));

  return g;
}

/* ---------------- build sanitized inputs (company-level) ---------------- */

export function buildExperienceInputs(
  parsed: ParsedResume | null,
  resumeText: string,
  targetRole: string,
  jobDescription: string
): {
  expInputs: ExperienceInput[];
  intInputs: ExperienceInput[];
  years?: number;
} {
  const rawExp = Array.isArray(parsed?.experiences) ? parsed!.experiences : [];
  const rawInt = Array.isArray(parsed?.internships) ? parsed!.internships : [];

  // force shape, drop empties early
  const force = (x: any): RawRole => ({
    title: s(x?.title || x?.role || x?.position || ""),
    company: s(x?.company || x?.employer || ""),
    location: s(x?.location || ""),
    start: s(x?.start || x?.from || ""),
    end: s(x?.end || x?.to || ""),
    bullets: Array.isArray(x?.bullets) ? x.bullets.map((b: any) => s(b)) : [],
    raw: s(x?.raw || ""),
  });

  let exp0 = rawExp.map(force).filter(it => it.company || it.title);
  let int0 = rawInt.map(force).filter(it => it.company || it.title);

  // move intern-titled experience items to internships
  const stayExp: RawRole[] = [];
  const movedToInt: RawRole[] = [];
  for (const it of exp0) (isInternTitle(it.title) ? movedToInt : stayExp).push(it);
  exp0 = stayExp;
  int0 = [...movedToInt, ...int0];

  // filter out education-like roles from both buckets
  exp0 = exp0.filter(it => !looksLikeEducation(it));
  int0 = int0.filter(it => !looksLikeEducation(it));

  // ---- GROUP BY (enhanced) COMPANY ----
  function groupByCompany(list: RawRole[]): Map<string, RawRole[]> {
    const map = new Map<string, RawRole[]>();
    for (const it of list) {
      let key = normCompany(it.company);
      if (!key) {
        // If company is missing, synthesize a stable key from title+dates to collapse duplicates
        const alt = [s(it.title).toLowerCase(), s(it.location).toLowerCase(), s(it.start), s(it.end)]
          .join("|").replace(/\s+/g, " ");
        key = `__no_company__::${alt || "unknown"}`;
      }
      const arr = map.get(key);
      if (arr) arr.push(it);
      else map.set(key, [it]);
    }
    return map;
  }

  const expGroups = groupByCompany(exp0);
  const intGroups = groupByCompany(int0);

  // aggregate each company group into a single company-level stint
  function toInputs(groups: Map<string, RawRole[]>, bucket: "exp" | "int"): ExperienceInput[] {
    const out: ExperienceInput[] = [];
    for (const [key, roles] of groups) {
      const agg = aggregateCompany(roles, key);
      // build one input per company group
      const start = agg.minStart !== undefined ? renderMonthKey(agg.minStart) : "";
      const end   = agg.maxEnd !== undefined ? renderMonthKey(agg.maxEnd)   : "";
      const displayTitle = agg.mostRecentTitle || (bucket === "int" ? "Intern" : "Associate");

      out.push({
        id: `${bucket}-${key}-${start}-${end}-${randId()}`,
        title: displayTitle,
        company: agg.company || (key.startsWith("__no_company__") ? "" : key),
        location: agg.location || "",
        start, end,
        bullets: agg.bullets,
        raw: agg.raw,
        targetRole: s(targetRole),
        resumeText,
        jobDescriptionText: s(jobDescription),
      });
    }

    // sort by end desc, then start desc
    out.sort((a, b) =>
      (monthKey(b.end) ?? -1) - (monthKey(a.end) ?? -1) ||
      (monthKey(b.start) ?? -1) - (monthKey(a.start) ?? -1)
    );

    // ----- HARD DE-DUPLICATION -----
    // collapse duplicates by (companyKey-ish + date range). Ignore content to avoid near-dup bullets producing extra buttons.
    const seen = new Set<string>();
    const deduped: ExperienceInput[] = [];
    for (const it of out) {
      const compKey = normCompany(it.company || "");
      const headerSig = [
        compKey || "__no_company__",
        s(it.start),
        s(it.end),
      ].join("|");
      if (seen.has(headerSig)) continue;
      seen.add(headerSig);
      deduped.push(it);
    }
    return deduped;
  }

  const expInputs = toInputs(expGroups, "exp");
  const intInputs = toInputs(intGroups, "int");

  // YEARS: sum months across company groups in expInputs only (consistent with parser behavior)
  let years: number | undefined = undefined;
  if (expInputs.length) {
    let months = 0;
    for (const [_, roles] of expGroups) {
      let m = 0;
      for (const r of roles) {
        m += monthsDiffInclusive(monthKey(r.start), monthKey(r.end));
      }
      months += Math.max(0, m);
    }
    years = Math.max(0, Math.round((months / 12) * 10) / 10);
  }

  return { expInputs, intInputs, years };
}
