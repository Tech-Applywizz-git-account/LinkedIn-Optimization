// lib/resumeParser.ts

// ---------------------------------
// Helpers to guarantee plain strings
// ---------------------------------
const s = (v: unknown): string => (v == null ? "" : String(v).trim());
const arr = <T>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

// -----------------------------
// Types (all strings, no undefined)
// -----------------------------
export type ExperienceItem = {
  title: string;
  company: string;
  location: string;
  start: string; // e.g., "Apr 2021" or "2021" or ""
  end: string;   // e.g., "Present" or "2022" or ""
  bullets: string[];
  raw: string;
};

export type EducationItem = {
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  location: string;
  raw: string;
};

export type ProjectItem = {
  name: string;
  description: string;
  bullets: string[];
  raw: string;
};

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;

  experiences: ExperienceItem[];
  internships: ExperienceItem[]; // separate
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  skills: string[];

  yearsExperience?: number;
  rawSections: Record<string, string>;
}

// -----------------------------
// Public API
// -----------------------------
export function parseResumeText(text: string): ParsedResume {
  const normalized = normalizeText(text);
  const sections = splitIntoSections(normalized);

  const summaryBlock = pickSection(sections, [
    "professional summary",
    "summary",
    "profile",
    "about",
  ]);

  const experienceBlock = pickSection(sections, [
    "professional experience",
    "experience",
    "employment history",
    "work experience",
    "work history",
  ]);

  const internshipsBlock = pickSection(sections, [
    "internships",
    "internship",
    "internship experience",
    "industrial training",
    "training",
  ]);

  const projectsBlock = pickSection(sections, ["projects", "project"]);
  const educationBlock = pickSection(sections, [
    "education",
    "academic background",
    "academics",
  ]);
  const certsBlock = pickSection(sections, ["certifications", "licenses"]);
  const skillsBlock = pickSection(sections, [
    "skills",
    "technical skills",
    "core skills",
  ]);

  // Strong line-by-line parsing (no blank-line splitting)
  let experiences = parseExperienceBlock(experienceBlock);
  let internships = parseExperienceBlock(internshipsBlock);

  // If internships section is empty, reclassify obvious intern titles
  if (!internships.length && experiences.length) {
    const isIntern = (t: string) => /\b(intern(ship)?|summer intern|winter intern)\b/i.test(t);
    const kept: ExperienceItem[] = [];
    const moved: ExperienceItem[] = [];
    for (const item of experiences) {
      if (isIntern(item.title)) moved.push(item);
      else kept.push(item);
    }
    if (moved.length) {
      internships = moved;
      experiences = kept;
    }
  }

  // Merge adjacent same-company stints
  experiences = mergeAdjacentSameCompany(experiences);

  // De-duplicate by (company,start,end)
  experiences = dedupeByCompanyAndDates(experiences);

  // Sort experiences by end date (desc), then start date (desc)
  experiences = sortByDatesDesc(experiences);

  const projects = parseProjectsBlock(projectsBlock);
  const education = parseEducationBlock(educationBlock);
  const certifications = parseSimpleList(certsBlock);
  const skills = parseSimpleList(skillsBlock);

  const yearsExperience = estimateYears(experiences);

  return {
    summary: s(summaryBlock) || undefined,
    experiences,
    internships,
    projects,
    education,
    certifications,
    skills,
    yearsExperience,
    rawSections: sections,
  };
}

export const parseResume = parseResumeText;
export default { parseResumeText };

// -----------------------------
// Core parsing helpers
// -----------------------------
function normalizeText(input: string): string {
  let t = input || "";
  t = t.replace(/\r\n/g, "\n").replace(/\t/g, "  ");
  t = t.replace(/[ \t]+\n/g, "\n"); // trim trailing spaces
  return t.trim();
}

function splitIntoSections(text: string): Record<string, string> {
  const lines = text.split("\n");
  const sections: Record<string, string> = {};
  let currentHeader = "preamble";
  let buffer: string[] = [];

  const flush = () => {
    const key = (currentHeader || "preamble").toLowerCase();
    const existing = sections[key] || "";
    sections[key] = (existing + "\n" + buffer.join("\n")).trim();
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (isHeaderLineFlexible(line)) {
      flush();
      currentHeader = normalizeHeaderKey(line);
    } else {
      buffer.push(raw);
    }
  }
  flush();

  return sections;
}

/** Accepts headers like "PROFESSIONAL EXPERIENCE", "Experience:", "Work Experience —", etc. */
function isHeaderLineFlexible(line: string): boolean {
  const t = line.trim();

  // Very short + mostly letters = likely a header (e.g., "EXPERIENCE")
  if (/^[A-Za-z\s&/()\-]+[:\-–—]?$/.test(t) && t.replace(/[^A-Za-z]/g, "").length >= 8 && t.length <= 60) {
    // fall through to keyword check
  }

  // Normalize punctuation for matching
  const cleaned = t
    .toLowerCase()
    .replace(/\s*[–—-]\s*$/g, "") // trailing dashes
    .replace(/\s*:\s*$/g, "")     // trailing colon
    .replace(/\s+/g, " ")
    .trim();

  // Allowed header keys
  const keys = new Set([
    "professional summary",
    "summary",
    "profile",
    "about",

    "professional experience",
    "experience",
    "employment history",
    "work experience",
    "work history",

    "projects",
    "project",

    "education",
    "academic background",
    "academics",

    "certifications",
    "licenses",

    "skills",
    "technical skills",
    "core skills",

    "internships",
    "internship",
    "internship experience",
    "industrial training",
    "training",
  ]);

  return keys.has(cleaned);
}

/** Normalize to internal keys used by pickSection() */
function normalizeHeaderKey(line: string): string {
  const t = line
    .toLowerCase()
    .replace(/\s*[–—-]\s*$/g, "")
    .replace(/\s*:\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const map: Record<string, string> = {
    "professional summary": "professional summary",
    "summary": "summary",
    "profile": "profile",
    "about": "about",

    "professional experience": "professional experience",
    "experience": "experience",
    "employment history": "employment history",
    "work experience": "work experience",
    "work history": "work history",

    "projects": "projects",
    "project": "projects",

    "education": "education",
    "academic background": "academic background",
    "academics": "academics",

    "certifications": "certifications",
    "licenses": "licenses",

    "skills": "skills",
    "technical skills": "technical skills",
    "core skills": "core skills",

    "internships": "internships",
    "internship": "internships",
    "internship experience": "internships",
    "industrial training": "industrial training",
    "training": "training",
  };

  return map[t] || t;
}

function pickSection(sections: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = sections[k.toLowerCase()];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

// -----------------------------
// Experience parser (line-by-line)
// -----------------------------
function parseExperienceBlock(block: string): ExperienceItem[] {
  if (!block) return [];

  const rawLines = block.split("\n");
  const lines = rawLines.map((l) => l.trim()); // keep empty lines as markers; we only act on headers

  const items: ExperienceItem[] = [];
  let current: ExperienceItem | null = null;
  let currentRaw: string[] = [];

  const flush = () => {
    if (!current) return;
    current.raw = s(currentRaw.join("\n"));
    // Dedup bullets
    const seen = new Set<string>();
    current.bullets = arr(current.bullets).filter((b) => {
      const k = s(b);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    // Force strings
    current.title = s(current.title);
    current.company = s(current.company);
    current.location = s(current.location);
    current.start = s(current.start);
    current.end = s(current.end);
    // Keep only entries with some identity
    if (current.company || current.title) items.push(current);
    current = null;
    currentRaw = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Header?
    if (isRoleHeader(line)) {
      const header = parseHeaderLine(line);

      // If no date on this line, check next line for date range
      if ((!header.start || !header.end) && i + 1 < lines.length) {
        const maybeDate = extractDateRange(lines[i + 1]);
        if (maybeDate) {
          header.start = header.start || maybeDate.start;
          header.end = header.end || maybeDate.end;
          currentRaw.push(lines[i + 1]);
          i += 1;
        }
      }

      // Start new item
      flush();
      current = {
        title: s(header.title),
        company: s(header.company),
        location: s(header.location),
        start: s(header.start),
        end: s(header.end),
        bullets: [],
        raw: "",
      };
      currentRaw.push(line);
      continue;
    }

    // Content line of current item
    if (!current) continue;

    currentRaw.push(line);

    // Bullet?
    const bulletStripped = line.replace(/^[•\-\–—]\s*/, "");
    if (bulletStripped !== line) {
      current.bullets.push(s(bulletStripped));
    }
  }

  flush();
  return items;
}

// Decide if a line is likely a role header (title/company and dates)
function isRoleHeader(line: string): boolean {
  const t = s(line);
  if (!t) return false;
  const hasPipe = t.includes("|");
  const hasDateOnLine = !!extractDateRange(t);
  const hasDashLike = /—|–|-/.test(t);

  if (hasDateOnLine && (hasPipe || hasDashLike)) return true;
  if ((/ at | – | — | - /.test(t)) && /[A-Za-z]/.test(t)) return true;
  if (hasPipe && /[A-Za-z]/.test(t)) return true;
  return false;
}

// Parse header
function parseHeaderLine(firstLine: string) {
  const line = s(firstLine).replace(/\u2013|\u2014/g, "–");
  let title = "";
  let company = "";
  let location = "";
  let start = "";
  let end = "";

  // pipe-based first
  const pipeParts = line.split("|").map((x) => s(x));
  if (pipeParts.length >= 2) {
    const left = pipeParts[0];
    const leftDates = extractDateRange(left);
    if (!leftDates) {
      const dashParts = left.split(/–|—|-/).map((x) => s(x));
      if (dashParts.length >= 2) {
        title = dashParts[0];
        company = dashParts.slice(1).join(" - ");
      } else {
        company = left;
      }
    } else {
      const leftNoDate = s(left.replace(leftDates.matched, ""));
      const dashParts = leftNoDate.split(/–|—|-/).map((x) => s(x));
      if (dashParts.length >= 2) {
        title = dashParts[0];
        company = dashParts.slice(1).join(" - ");
      } else {
        company = leftNoDate;
      }
      start = leftDates.start || start;
      end = leftDates.end || end;
    }

    for (let i = 1; i < pipeParts.length; i++) {
      const frag = pipeParts[i];
      const d = extractDateRange(frag);
      if (d) {
        start = start || d.start || "";
        end = end || d.end || "";
      } else if (!location) {
        location = frag;
      }
    }
    return { title, company, location, start, end };
  }

  // dash-based
  const dashParts = line.split(/–|—|-/).map((x) => s(x));
  if (dashParts.length >= 2) {
    for (let i = dashParts.length - 1; i >= 0; i--) {
      const d = extractDateRange(dashParts[i]);
      if (d) {
        start = d.start || start;
        end = d.end || end;
        dashParts.splice(i, 1);
        break;
      }
    }
    if (dashParts.length >= 2) {
      const first = dashParts[0];
      const atMatch = first.match(/(.+?)\s+at\s+(.+)$/i);
      if (atMatch) {
        title = s(atMatch[1]);
        company = s(atMatch[2]);
      } else {
        title = dashParts[0];
        company = dashParts[1];
      }
      if (dashParts.length >= 3) location = dashParts[2];
    } else {
      company = dashParts[0] || company;
    }
  }

  return { title, company, location, start, end };
}

function extractDateRange(sv: string):
  | { start: string; end: string; matched: string }
  | null {
  const m = s(sv).match(
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(?:–|—|-|to)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\b/i
  );
  if (!m) return null;
  return { start: s(m[1]), end: s(m[2]), matched: s(m[0]) };
}

// -----------------------------
// Projects / Education / Skills
// -----------------------------
function parseProjectsBlock(block: string): ProjectItem[] {
  if (!block) return [];
  const items: ProjectItem[] = [];
  const chunks = block.split(/\n{2,}/).map((x) => s(x)).filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((x) => s(x)).filter(Boolean);
    if (!lines.length) continue;
    const name = s(lines[0]);
    const bullets = lines.slice(1).map((l) => s(l.replace(/^[•\-\–—]\s*/, ""))).filter(Boolean);
    items.push({
      name,
      description: s(bullets[0] || ""),
      bullets,
      raw: chunk,
    });
  }
  return items;
}

function parseEducationBlock(block: string): EducationItem[] {
  if (!block) return [];
  const out: EducationItem[] = [];
  const chunks = block.split(/\n{2,}/).map((x) => s(x)).filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((x) => s(x)).filter(Boolean);
    if (!lines.length) continue;
    const first = lines[0];
    const { school, degree, field, start, end, location } = parseEducationHeader(first);
    out.push({
      school: s(school),
      degree: s(degree),
      field: s(field),
      start: s(start),
      end: s(end),
      location: s(location),
      raw: chunk,
    });
  }
  return out;
}

function parseEducationHeader(line: string) {
  const parts = s(line).replace(/\u2013|\u2014/g, "–").split("–");
  let left = s(parts[0] || "");
  let right = s(parts.slice(1).join("–"));

  let school = left;
  let degree = "";
  let field = "";
  let location = "";
  let start = "";
  let end = "";

  if (right) {
    const pipeParts = right.split("|").map((x) => s(x));
    for (const frag of pipeParts) {
      const d = extractDateRange(frag);
      if (d) {
        start = start || d.start;
        end = end || d.end;
        continue;
      }
      if (!location && /,/.test(frag)) {
        location = frag;
        continue;
      }
      if (!degree) {
        degree = frag;
        const inMatch = degree.match(/\bin\s+(.+)$/i);
        if (inMatch) {
          field = s(inMatch[1]);
          degree = s(degree.replace(/\bin\s+(.+)$/i, ""));
        }
      }
    }
  }

  return { school, degree, field, start, end, location };
}

function parseSimpleList(block: string): string[] {
  if (!block) return [];
  const parts = block.split(/\n|,/).map((x) => s(x)).filter(Boolean);
  return Array.from(new Set(parts));
}

// -----------------------------
// Date helpers (typed month map)
// -----------------------------
const MONTH_MAP = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,   // note: 'sept' becomes 'sep' by slice(0,3)
  oct: 10,
  nov: 11,
  dec: 12,
} as const;
type MonthAbbrev = keyof typeof MONTH_MAP;

function normalizeMonthAbbrev(input: string): MonthAbbrev | null {
  const key = input.slice(0, 3).toLowerCase();
  return (key in MONTH_MAP ? (key as MonthAbbrev) : null);
}

function monthKey(v: string): number | undefined {
  const str = (v || "").trim();
  if (!str) return undefined;
  if (/^(present|current)$/i.test(str)) return 999999;

  // 06/2022
  const m1 = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (m1) {
    const mm = Math.max(1, Math.min(12, parseInt(m1[1], 10)));
    const yy = parseInt(m1[2], 10);
    return yy * 100 + mm;
  }

  // Apr 2021, Sept 2020, etc.
  const m2 = str.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})$/i);
  if (m2) {
    const abbr = normalizeMonthAbbrev(m2[1]);
    const yy = parseInt(m2[2], 10);
    const mm = abbr ? MONTH_MAP[abbr] : 1;
    return yy * 100 + mm;
  }

  // 2021
  const m3 = str.match(/^(\d{4})$/);
  if (m3) {
    const yy = parseInt(m3[1], 10);
    return yy * 100 + 1;
  }

  return undefined;
}

function renderMonthKey(n?: number): string | undefined {
  if (n === undefined) return undefined;
  if (n === 999999) return "Present";
  const yy = Math.floor(n / 100);
  const mm = n % 100;
  const NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
  return `${NAMES[Math.max(1, Math.min(12, mm)) - 1]} ${yy}`;
}

function minMonth(a?: number, b?: number): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.min(a, b);
}
function maxMonth(a?: number, b?: number): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}

// -----------------------------
// Merge & Deduplicate (TS-safe)
// -----------------------------
function mergeAdjacentSameCompany(items: ExperienceItem[]): ExperienceItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const out: ExperienceItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const curr: ExperienceItem = {
      title: s(items[i].title),
      company: s(items[i].company),
      location: s(items[i].location),
      start: s(items[i].start),
      end: s(items[i].end),
      bullets: arr(items[i].bullets).map((b) => s(b)),
      raw: s(items[i].raw),
    };

    const prev: ExperienceItem | undefined =
      out.length > 0 ? out[out.length - 1] : undefined;

    if (prev && sameCompany(prev, curr)) {
      // widen date range
      const sPrev = monthKey(prev.start);
      const sCurr = monthKey(curr.start);
      const ePrev = monthKey(prev.end);
      const eCurr = monthKey(curr.end);

      const newStart =
        sPrev === undefined
          ? sCurr
          : sCurr === undefined
          ? sPrev
          : Math.min(sPrev, sCurr);

      const newEnd =
        ePrev === undefined
          ? eCurr
          : eCurr === undefined
          ? ePrev
          : Math.max(ePrev, eCurr);

      const renderedStart = renderMonthKey(newStart);
      const renderedEnd = renderMonthKey(newEnd);

      prev.start = renderedStart ?? prev.start ?? curr.start;
      prev.end = renderedEnd ?? prev.end ?? curr.end;

      if (!s(prev.title) && s(curr.title)) prev.title = curr.title;
      if (!s(prev.location) && s(curr.location)) prev.location = curr.location;

      // merge bullets (dedupe)
      const seen = new Set<string>(prev.bullets.map((b) => s(b)));
      for (const b of curr.bullets) {
        const k = s(b);
        if (k && !seen.has(k)) {
          prev.bullets.push(k);
          seen.add(k);
        }
      }

      prev.raw = s(prev.raw) + (curr.raw ? `\n\n${curr.raw}` : "");
    } else {
      out.push(curr);
    }
  }

  return out;
}

function dedupeByCompanyAndDates(items: ExperienceItem[]): ExperienceItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const pickScore = (it: ExperienceItem) =>
    it.bullets.length + it.raw.length;

  const map = new Map<string, ExperienceItem>();
  for (const it of items) {
    const key = [
      s(it.company).toLowerCase(),
      s(it.start).toLowerCase(),
      s(it.end).toLowerCase(),
    ].join("||");

    const prev = map.get(key);
    if (!prev) {
      map.set(key, it);
      continue;
    }

    if (pickScore(it) > pickScore(prev)) {
      map.set(key, it);
    }
  }
  return Array.from(map.values());
}

function sameCompany(a: ExperienceItem, b: ExperienceItem): boolean {
  const ca = s(a.company).toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
  const cb = s(b.company).toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
  return !!ca && ca === cb;
}

function sortByDatesDesc(items: ExperienceItem[]): ExperienceItem[] {
  return [...items].sort((a, b) => {
    const ae = monthKey(a.end) ?? -1;
    const be = monthKey(b.end) ?? -1;
    if (be !== ae) return be - ae;
    const as = monthKey(a.start) ?? -1;
    const bs = monthKey(b.start) ?? -1;
    return bs - as;
  });
}

// -----------------------------
// Years estimate (robust union of intervals)
// -----------------------------
function estimateYears(experiences: ExperienceItem[]): number | undefined {
  if (!Array.isArray(experiences) || experiences.length === 0) return undefined;

  // Convert any supported date token to YYYYMM, treat Present/Current as the current month
  const toYYYYMM = (v: string): number | undefined => {
    const str = s(v);
    if (!str) return undefined;

    // Present / Current -> now
    if (/^(present|current)$/i.test(str)) {
      const d = new Date();
      return d.getFullYear() * 100 + (d.getMonth() + 1);
    }

    // 06/2022
    const m1 = str.match(/^(\d{1,2})\/(\d{4})$/);
    if (m1) {
      const mm = Math.max(1, Math.min(12, parseInt(m1[1], 10)));
      const yy = parseInt(m1[2], 10);
      return yy * 100 + mm;
    }

    // Apr 2021, Sept 2020, etc.
    const m2 = str.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})$/i);
    if (m2) {
      const ab = normalizeMonthAbbrev(m2[1] || "");
      const yy = parseInt(m2[2], 10);
      const mm = ab ? MONTH_MAP[ab] : 1;
      return yy * 100 + mm;
    }

    // 2021
    const m3 = str.match(/^(\d{4})$/);
    if (m3) {
      const yy = parseInt(m3[1], 10);
      return yy * 100 + 1;
    }

    return undefined;
  };

  const ord = (n: number) => Math.floor(n / 100) * 12 + ((n % 100) - 1);

  // Collect spans (ignore items with unknown dates)
  const spans: Array<[number, number]> = [];
  for (const e of experiences) {
    const sKey = toYYYYMM(e.start);
    const eKey = toYYYYMM(e.end);
    if (sKey === undefined || eKey === undefined) continue;
    const sVal = Math.min(sKey, eKey);
    const eVal = Math.max(sKey, eKey);
    spans.push([sVal, eVal]);
  }
  if (!spans.length) return undefined;

  // Sort and union-merge by start date
  spans.sort((a, b) => a[0] - b[0]);

  let curS = spans[0][0];
  let curE = spans[0][1];
  let totalMonths = 0;

  const add = (s: number, e: number) => {
    totalMonths += (ord(e) - ord(s) + 1); // inclusive month count
  };

  for (let i = 1; i < spans.length; i++) {
    const [s, e] = spans[i];
    if (ord(s) <= ord(curE) + 1) {
      // overlap or contiguous
      if (ord(e) > ord(curE)) curE = e;
    } else {
      add(curS, curE);
      curS = s; curE = e;
    }
  }
  add(curS, curE);

  const years = totalMonths / 12;
  return Math.max(0, Math.round(years * 10) / 10);
}
