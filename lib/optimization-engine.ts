import { ParsedResume } from "@/lib/resumeParser";

export interface OptimizeInputs {
  targetRole: string;
  resume: ParsedResume;
  jobDescriptionText?: string;
  domainKeywords: string[];
  industry?: string;
}

export interface GeneratedProfile {
  headline: string;
  about: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  certifications: string;
  banner: { concepts: string[]; aiPrompts: string[] };
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|[-/]|,)/)
    .map(chunk => /^[a-z]/.test(chunk) ? chunk[0].toUpperCase() + chunk.slice(1) : chunk)
    .join("");
}

function clamp(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1).trimEnd() + "…";
}

function uniqueLower(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const k = it.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

function pickTopSkills(tokens: string[], n: number): string[] {
  const map = new Map<string, number>();
  tokens.forEach(t => map.set(t, (map.get(t) ?? 0) + 1));
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s,|/;()\n\r•\-–—]+/)
    .map(s => s.replace(/[^a-zA-Z0-9+.#]/g, "").toLowerCase())
    .filter(Boolean);
}

/** HEADLINE */
export function makeHeadline(
  targetRole: string,
  resume: ParsedResume,
  jobDescriptionText: string | undefined,
  domainKeywords: string[]
): string {
  const yoe = resume.totalYOE ?? undefined;

  const resumeTokens = tokenize([resume.rawText ?? "", resume.skills.join(" "), resume.about ?? ""].join(" "));
  const jdTokens = tokenize(jobDescriptionText ?? "");
  const coreSkills = uniqueLower([
    ...resume.skills.map(s => s.trim()),
    ...pickTopSkills([...resumeTokens, ...jdTokens], 6),
  ]).slice(0, 6);

  const prioritized = uniqueLower(domainKeywords).slice(0, 3);
  const domainChunk = prioritized.join(" • ");
  const yoeChunk = yoe ? `${yoe}+ YOE` : "Experienced";

  const headline = `${titleCase(targetRole)} | ${yoeChunk} • ${coreSkills.slice(0, 3).map(titleCase).join(", ")} | ${domainChunk}`;
  return clamp(headline, 220);
}

/** ABOUT (3 paragraphs; include all domain keywords) */
export function makeAbout(
  targetRole: string,
  resume: ParsedResume,
  jobDescriptionText: string | undefined,
  domainKeywords: string[]
): string {
  const intro = `As a ${titleCase(targetRole)}, I specialize in ${domainKeywords.join(", ")} with a focus on measurable outcomes and scalable delivery.`;
  const body = `My background spans ${resume.totalYOE ? resume.totalYOE + "+ years" : "several years"} across initiatives involving ${domainKeywords.join(", ")}. I’ve delivered projects using ${uniqueLower(resume.skills).slice(0, 10).join(", ")}, aligning execution to role requirements and business goals.`;
  const close = `I aim to advance in ${titleCase(targetRole)} roles where ${domainKeywords.join(", ")} shape strategy, working with cross‑functional teams to drive impact.`;
  return clamp([intro, body, close].join("\n\n"), 2000);
}

/** EXPERIENCE (markdown with **bold** domain keywords) */
export function makeExperience(resume: ParsedResume, domainKeywords: string[]): string {
  const emphasize = (line: string): string => {
    let out = line;
    for (const k of domainKeywords) {
      const rx = new RegExp(`\\b(${k.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})\\b`, "ig");
      out = out.replace(rx, "**$1**");
    }
    return out;
  };

  if (!resume.experiences.length) return "_No professional experience parsed from resume._";

  const blocks = resume.experiences.map(e => {
    const header = `**${e.title || "Role"}** — ${e.company ?? ""} ${e.location ? "· " + e.location : ""} ${e.end ? `(${e.end})` : ""}`.trim();
    const bullets = (e.bullets.length ? e.bullets : ["Delivered measurable outcomes aligned to role scope."]).slice(0, 6);
    const mdBullets = bullets.map(b => `- ${emphasize(b)}`).join("\n");
    return `${header}\n${mdBullets}`;
  });

  return blocks.join("\n\n");
}

/** PROJECTS (markdown with **bold** domain keywords) */
export function makeProjects(resume: ParsedResume, domainKeywords: string[]): string {
  if (!resume.projects.length) return "_No projects parsed from resume._";

  const boldify = (s: string): string =>
    domainKeywords.reduce((acc, k) => acc.replace(new RegExp(`\\b(${k})\\b`, "ig"), "**$1**"), s);

  return resume.projects
    .slice(0, 6)
    .map(p => {
      const title = `${p.name} – ( ${boldify((p.tech ?? []).join(", ") || "Domain Tools & Technologies")} )`;
      const bullets = (p.bullets.length ? p.bullets : ["Delivered outcomes and performance improvements."]).slice(0, 3);
      return `${title}\n${bullets.map(b => `- ${boldify(b)}`).join("\n")}`;
    })
    .join("\n\n");
}

/** SKILLS (Top domain keywords first; top 10 bold) */
export function makeSkills(resume: ParsedResume, domainKeywords: string[]): string {
  const base = uniqueLower([
    ...domainKeywords,
    ...resume.skills,
    ...pickTopSkills(tokenize(resume.rawText ?? ""), 40),
  ]);

  const top10 = new Set(base.slice(0, 10).map(s => s.toLowerCase()));
  const styled = base.slice(0, 40).map(s => top10.has(s.toLowerCase()) ? `**${s}**` : s);
  return styled.join(" · ");
}

/** EDUCATION */
export function makeEducation(resume: ParsedResume): string {
  if (!resume.education.length) return "_Education details not found in resume._";

  return resume.education
    .slice(0, 4)
    .map(ed => {
      const header = `**${ed.degree}**, ${ed.school}${ed.year ? ` (${ed.year})` : ""}`;
      const details = (ed.details ?? []).slice(0, 2);
      return [header, ...details].join("\n");
    })
    .join("\n\n");
}

/** CERTIFICATIONS (max 6) */
export function makeCertifications(resume: ParsedResume, targetRole: string): string {
  const raw = resume.certifications.slice(0, 6);
  if (raw.length) {
    return raw.map(c => `- ${c}`).join("\n");
  }
  // suggest if none present
  return [
    `- ${titleCase(targetRole)} Foundations – LinkedIn Learning`,
    `- ${titleCase(targetRole)} Specialization – Coursera`,
    `- Practitioner Badge – AWS | Azure | GCP (role‑aligned)`,
  ].join("\n");
}

/** BANNER concepts + prompts */
export function makeBanner(targetRole: string, industry: string | undefined, domainKeywords: string[]) {
  const role = titleCase(targetRole);
  const ind = industry ? titleCase(industry) : "Corporate";

  const concepts = [
    `${role} • ${ind} • Minimal grid with subtle patterns inspired by ${domainKeywords.slice(0,3).join(", ")}`,
    `${role} Roadmap • Diagrams & KPI chips • Clean navy/white palette`,
    `${role} • Icon row (tools/tech) • High contrast text zone (left)`,
  ];

  const basePrompt = (variant: string) =>
    `LinkedIn banner, 1584x396, ${variant}, minimal, professional, navy/blue/gray/white, high contrast text area, vector icons relating to ${domainKeywords.join(", ")}, clean lines, no photos, no clutter.`;

  const aiPrompts = [
    basePrompt(`${role} in ${ind}, modern grid with subtle code/data patterns`),
    basePrompt(`${role} focus, charts/diagrams motif, KPI chips on the right`),
    basePrompt(`${role} toolkit strip of icons across bottom, negative space left`),
  ];

  return { concepts, aiPrompts };
}

/** Orchestrator */
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
