export interface ExperienceItem {
  title: string;
  company?: string;
  location?: string;
  start?: string;
  end?: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  description?: string;
  bullets: string[];
  tech?: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  year?: string;
  details?: string[];
}

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  about?: string;
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  skills: string[];
  totalYOE?: number;
  rawText?: string;
}

const sectionMatchers = [
  /(professional\s+summary|summary|profile|about)\b/i,
  /(experience|employment\s+history|work\s+experience)\b/i,
  /(projects?)\b/i,
  /(education|academic\s+background)\b/i,
  /(certifications?|licenses?)\b/i,
  /(skills?|technical\s+skills)\b/i
];

function splitIntoSections(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/);
  const sections: Record<string, string> = {};
  let current = "header";
  sections[current] = "";

  for (const line of lines) {
    const h = sectionMatchers.find(rx => rx.test(line));
    if (h) {
      current = (h.source.match(/^\(\?i\)([^\|]+)/)?.[1] || h.source)
        .replace(/[()\\?i]/g, "")
        .split("|")[0]
        .trim()
        .toLowerCase();
      sections[current] = "";
      continue;
    }
    sections[current] = (sections[current] || "") + line + "\n";
  }
  return sections;
}

function extractYOE(text: string): number | undefined {
  const direct = text.match(/(\d{1,2})\s*\+?\s*years?/i);
  if (direct) return Number(direct[1]);

  const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map(m => Number(m[0]));
  if (years.length >= 2) {
    const minY = Math.min(...years);
    const maxY = Math.max(...years);
    if (maxY > minY) return Math.max(1, maxY - minY + 1);
  }
  return undefined;
}

function pickEmail(text: string): string | undefined {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
}

function pickPhone(text: string): string | undefined {
  return text.match(/(\+?\d[\d\s\-().]{8,})/)?.[0]?.trim();
}

function parseSkills(block: string | undefined): string[] {
  if (!block) return [];
  return block
    .split(/[\n,•|/;-]+/)
    .map(s => s.replace(/^[•\-–—]\s*/, "").trim())
    .filter(Boolean);
}

export function parseResumeText(text: string): ParsedResume {
  const sections = splitIntoSections(text);

  const header = sections["header"] || "";
  const about = (sections["professional summary"] || sections["summary"] || sections["profile"] || sections["about"] || "").trim();
  const exp = (sections["experience"] || sections["employment history"] || sections["work experience"] || "").trim();
  const projects = (sections["projects"] || "").trim();
  const education = (sections["education"] || sections["academic background"] || "").trim();
  const certs = (sections["certifications"] || sections["licenses"] || "").trim();
  const skills = (sections["skills"] || sections["technical skills"] || "").trim();

  const name = header.split("\n").map(l => l.trim()).filter(Boolean)[0];

  const experiences: ExperienceItem[] = exp
    ? exp.split(/\n{2,}/).map(block => {
        const first = block.split("\n").map(s => s.trim()).filter(Boolean)[0] || "";
        const titleMatch = first.match(/^(.{3,100}?)(?:\s[-–—]\s|,|\s\|)(.{2,80})?/);
        const title = titleMatch?.[1]?.trim() || first;
        const company = titleMatch?.[2]?.trim();
        const dateLine = block.match(/\b(19|20)\d{2}.*?(Present|\b(19|20)\d{2}\b)/i)?.[0];

        const bullets = block
          .split("\n")
          .slice(1)
          .map(s => s.replace(/^[•\-–—]\s*/, "").trim())
          .filter(Boolean);

        return { title, company, location: undefined, start: undefined, end: dateLine, bullets };
      })
    : [];

  const projectItems: ProjectItem[] = projects
    ? projects.split(/\n{2,}/).map(b => {
        const [first, ...rest] = b.split("\n").map(s => s.trim()).filter(Boolean);
        const bullets = rest.map(s => s.replace(/^[•\-–—]\s*/, "").trim()).filter(Boolean);
        return { name: first || "Project", description: undefined, bullets, tech: [] };
      })
    : [];

  const educationItems: EducationItem[] = education
    ? education.split(/\n{2,}/).map(b => {
        const [first, ...rest] = b.split("\n").map(s => s.trim()).filter(Boolean);
        const year = b.match(/\b(19|20)\d{2}\b/)?.[0];
        return { degree: first || "Degree", school: rest[0] || "", year, details: rest.slice(1) };
      })
    : [];

  const certItems = certs
    ? certs.split(/\n+/).map(s => s.replace(/^[•\-–—]\s*/, "").trim()).filter(Boolean)
    : [];

  return {
    name,
    email: pickEmail(text),
    phone: pickPhone(text),
    headline: undefined,
    about,
    experiences,
    projects: projectItems,
    education: educationItems,
    certifications: certItems,
    skills: parseSkills(skills),
    totalYOE: extractYOE(text),
    rawText: text
  };
}
