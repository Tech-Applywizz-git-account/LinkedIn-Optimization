// lib/optimization-engine.ts
import { ParsedResume } from "@/lib/resumeParser";

export interface OptimizeInputs {
  targetRole: string;          // kept for API compatibility; ignored in content
  resume: ParsedResume;
  jobDescriptionText?: string; // ignored in content
  domainKeywords: string[];    // ignored in content
  industry?: string;           // ignored in content
}

export interface GeneratedProfile {
  headline: string;
  about: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  certifications: string;
  banner: string;
}

/* ---------------- Helpers ---------------- */

function toTitle(s: string) {
  return (s || "").replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}
function clamp(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max);
}
function listify(items?: Array<string | undefined | null>, max?: number) {
  const arr = (items || []).map(x => (x ?? "").trim()).filter(Boolean);
  return typeof max === "number" ? arr.slice(0, max) : arr;
}

/* ---------------- HEADLINE — resume only ---------------- */

export function makeHeadline(
  _targetRole: string,
  resume: ParsedResume,
  _jobDescriptionText?: string,
  _domainKeywords?: string[]
): string {
  const yoe = resume.yearsExperience;
  const latest = resume.experiences?.[0];
  const role = (latest?.title || "Professional").trim();

  const topSkills = Array.isArray(resume.skills)
    ? resume.skills.filter(Boolean).slice(0, 3)
    : [];

  const parts = [
    toTitle(role),
    yoe ? `${yoe}+ YOE` : null,
    topSkills.length ? topSkills.map(toTitle).join(", ") : null,
  ].filter(Boolean);

  return clamp(parts.join(" | "), 220);
}

/* ---------------- ABOUT — resume only ---------------- */

export function makeAbout(
  _targetRole: string,
  resume: ParsedResume,
  _jobDescriptionText?: string,
  _domainKeywords?: string[]
): string {
  const lines: string[] = [];
  const yoe = resume.yearsExperience ? `${resume.yearsExperience}+ years` : "";

  const latest = resume.experiences?.[0];
  const title = latest?.title ? toTitle(latest.title) : null;

  const opener = [title, yoe].filter(Boolean).join(" · ");
  if (opener) lines.push(opener);

  const skills = listify(resume.skills, 12);
  if (skills.length) lines.push(`Key Skills: ${skills.join(", ")}`);

  // Add 2–6 summarized outcomes from experiences if present
  const bullets: string[] = [];
  for (const r of resume.experiences || []) {
    for (const b of listify(r.bullets)) {
      bullets.push(`- ${b}`);
      if (bullets.length >= 6) break;
    }
    if (bullets.length >= 6) break;
  }
  if (bullets.length) lines.push("", ...bullets);

  return lines.join("\n");
}

/* ---------------- EXPERIENCE — resume only (combined text) ---------------- */

export function makeExperience(
  resume: ParsedResume,
  _domainKeywords?: string[]
): string {
  const out: string[] = [];
  for (const r of resume.experiences || []) {
    const header = [
      r.title ? toTitle(r.title) : null,
      r.company ? toTitle(r.company) : null,
      r.location || null,
      [r.start, r.end].filter(Boolean).join(" – ") || null,
    ].filter(Boolean).join(" | ");
    if (header) out.push(header);
    const bs = listify(r.bullets, 7);
    for (const b of bs) out.push(`- ${b}`);
    out.push("");
  }
  return out.join("\n").trim();
}

/* ---------------- PROJECTS — resume only ---------------- */

export function makeProjects(
  resume: ParsedResume,
  _domainKeywords?: string[]
): string {
  const out: string[] = [];
  for (const p of resume.projects || []) {
    const header = p.name ? toTitle(p.name) : "Project";
    out.push(header);
    for (const b of listify(p.bullets, 4)) out.push(`- ${b}`);
    out.push("");
  }
  return out.join("\n").trim();
}

/* ---------------- SKILLS — resume only ---------------- */

export function makeSkills(
  resume: ParsedResume,
  _domainKeywords?: string[]
): string {
  const skills = listify(resume.skills);
  return skills.length ? `Skills: ${skills.join(", ")}` : "";
}

/* ---------------- EDUCATION — resume only (NO bullets in type) ---------------- */

export function makeEducation(resume: ParsedResume): string {
  const out: string[] = [];
  for (const e of resume.education || []) {
    // EducationItem fields from parser: school, degree, field, start, end, location, raw
    const headerParts = [
      e.degree ? toTitle(e.degree) : null,
      e.field ? toTitle(e.field) : null,
      e.school ? toTitle(e.school) : null,
      e.location || null,
      [e.start, e.end].filter(Boolean).join(" – ") || null,
    ].filter(Boolean);
    const header = headerParts.join(" | ");
    if (header) out.push(header);
    out.push("");
  }
  return out.join("\n").trim();
}

/* ---------------- CERTIFICATIONS — resume only (NO YEAR) ---------------- */

export function makeCertifications(
  resume: ParsedResume,
  _targetRole?: string
): string {
  const certs = listify(resume.certifications);
  if (!certs.length) return "";

  // Remove years/dates from each line (e.g., "2022", "2021-2023", "Jan 2024")
  const cleaned = certs.map((c) =>
    c.replace(/\b(?:19|20)\d{2}\b/g, "")                      // 2020
     .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\b/gi, "") // Jan 2024
     .replace(/\b(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\b/gi, "") // 2021-2023
     .replace(/[()\-–—]\s*$/g, "")                             // trailing punctuation if any
     .replace(/\s{2,}/g, " ")
     .trim()
  );

  return cleaned.map((c) => `- ${c}`).join("\n");
}

/* ---------------- BANNER (kept neutral) ---------------- */

export function makeBanner(
  _targetRole: string,
  _industry?: string,
  _domainKeywords?: string[]
): string {
  return [
    "Concept 1: Clean geometric pattern with initials over subtle grid.",
    "Concept 2: Abstract data lines over soft gradient.",
    "Concept 3: Minimal skyline silhouette with neutral colors.",
    "",
    "AI Prompt (1584×396): Minimal abstract banner, soft gradient, clean geometric lines, no text, high contrast edges.",
  ].join("\n");
}

/* ---------------- Aggregate ---------------- */

export function generateProfile(input: OptimizeInputs): GeneratedProfile {
  const { targetRole, resume, jobDescriptionText, domainKeywords, industry } = input;

  const headline = makeHeadline(targetRole, resume, jobDescriptionText, domainKeywords);
  const about = makeAbout(targetRole, resume, jobDescriptionText, domainKeywords);
  const experience = makeExperience(resume, domainKeywords);
  const projects = makeProjects(resume, domainKeywords);
  const skills = makeSkills(resume, domainKeywords);
  const education = makeEducation(resume);
  const certifications = makeCertifications(resume, targetRole);
  const banner = makeBanner(targetRole, industry, domainKeywords);

  return { headline, about, experience, projects, skills, education, certifications, banner };
}
