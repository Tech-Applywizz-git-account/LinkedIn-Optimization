// // app/api/generate-section/route.ts
// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// import { pickBySection, pickAuto, countTokens, estimateCostINR, type LLMModel } from "@/lib/modelPicker";

// import { sanitizeLLMText } from "@/lib/sanitize";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// /* -------------------------- Prompt helpers (unchanged for non-experience) -------------------------- */

// function header() {
//   return `You are a LinkedIn optimization expert with 15+ years in corporate career branding for ApplyWizz.
// Write corporate, recruiter-friendly, keyword-rich content with measurable outcomes.

// Formatting rules (VERY IMPORTANT):
// - Plain text only. Do NOT use *, _, #, markdown code fences, or backticks.
// - Bullets (if any) must start with "- " (dash+space) — no emojis.
// - Never invent facts. Use ONLY content present in [Resume_Text] or [ROLE CONTEXT] when provided.
// - If a requested detail is missing from the resume, OMIT it instead of guessing.`;
// }

// function whichItem(subIndex?: number) {
//   if (typeof subIndex !== "number" || subIndex < 0) return "Write the MOST RECENT role.";
//   const n = subIndex + 1;
//   if (n === 1) return "Write the MOST RECENT role.";
//   return `Write the ${n}th most recent role (ensure it is distinct from earlier roles).`;
// }

// /* -------------------------- PDF/Text sanitization (needed for reliable extraction) -------------------------- */

// function sanitizeResume(text: string = ""): string {
//   return text
//     .replace(/\u00A0/g, " ")            // NBSP -> space
//     .replace(/\uFFFD/g, "-")            // replacement char -> hyphen
//     .replace(/[\u2013\u2014]/g, "-")    // en/em dash -> hyphen
//     .replace(/[•▪·●■]/g, "-")           // bullets -> hyphen
//     .replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/g, "$1$2") // de-hyphenate across line break
//     .replace(/([^\n])\n(?!\n|- |\* |\d+\. )/g, "$1 ")  // unwrap soft line breaks
//     .replace(/\n{3,}/g, "\n\n")         // collapse blank lines
//     .replace(/[ \t]{2,}/g, " ")         // collapse spaces
//     .trim();
// }

// /* -------------------------- STRICT filter for company buttons -------------------------- */

// function normalizeCompanyName(raw: string = ""): string {
//   return raw
//     .toLowerCase()
//     .replace(/&/g, "and")
//     .replace(/[@]/g, " at ")
//     .replace(/[^a-z0-9]+/g, " ")
//     .replace(/\b(llc|inc|incorporated|corp|corporation|ltd|co|plc|pvt|private|limited)\b/g, "")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// function isBadCompanyName(name: string = ""): boolean {
//   const n = (name || "").trim();
//   if (!n) return true;

//   const lower = n.toLowerCase();

//   // Obvious non-companies
//   if (["linkedin", "github", "portfolio"].includes(lower)) return true;

//   // Section headers / noise
//   const badTokens = [
//     "professional summary","summary","objective","projects","project",
//     "education","certifications","skills","technical skills",
//     "contact","phone","email","achievements","awards","publications"
//   ];
//   if (badTokens.some(t => lower.includes(t))) return true;

//   // Emails / URLs
//   if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(n)) return true;
//   if (lower.includes("http") || lower.includes("www.")) return true;

//   // Bare location like "Hyderabad, India"
//   if (/^\s*[A-Za-z .-]+,\s*[A-Za-z .-]+\s*$/.test(n)) return true;

//   // Lines that look like headings (ALL CAPS words, no vowels) – aggressive, so keep it simple:
//   const letters = n.replace(/[^a-z]/gi, "");
//   if (letters && !/[aeiou]/i.test(letters) && letters.length >= 5) return true;

//   return false;
// }

// /** A role is valid if it has a title OR at least one bullet. Dates can be missing (resumes vary). */
// function isValidRole(role: any): boolean {
//   if (!role || typeof role !== "object") return false;
//   const hasTitle = !!(role.title && String(role.title).trim());
//   const hasBullets = Array.isArray(role.bullets) && role.bullets.some((b: any) => String(b || "").trim());
//   return hasTitle || hasBullets;
// }

// /** Merge duplicates, drop invalid/noisy companies, keep only real employers. */
// function canonicalizeItems(input: any): Array<any> {
//   const arr: any[] = Array.isArray(input) ? input : [];
//   const byKey: Record<string, any> = {};

//   for (const item of arr) {
//     const companyRaw = String(item?.company || "").trim();
//     if (!companyRaw || isBadCompanyName(companyRaw)) continue;

//     const key = normalizeCompanyName(companyRaw);
//     if (!key) continue;

//     const roles = Array.isArray(item?.roles) ? item.roles.filter(isValidRole) : [];
//     if (roles.length === 0) continue;

//     if (!byKey[key]) {
//       byKey[key] = {
//         company: companyRaw,
//         company_normalized: key,
//         roles: [],
//       };
//     }
//     byKey[key].roles.push(...roles);
//   }

//   // Optional: sort roles deterministically by 'start' string
//   Object.values(byKey).forEach((obj: any) => {
//     obj.roles.sort((a: any, b: any) => String(a.start || "").localeCompare(String(b.start || "")));
//   });

//   return Object.values(byKey);
// }

// /* -------------------------- section prompts (kept same except strict JSON for buttons) -------------------------- */

// function sectionPrompt(section: string, subIndex?: number, hasRoleContext?: boolean) {
//   switch (section) {
//     /* ---------------- HEADLINE (resume-only) ---------------- */
//     case "headline":
//       return `Task:
// Create a LinkedIn HEADLINE using ONLY facts found in [Resume_Text].
// - Use the most recent role/title from the resume (no aspirational or target role).
// - ALWAYS include total years of experience if it is explicitly present in the resume (e.g., "4+ Years").
// - Include up to 3 skills explicitly listed in the resume (no extras, no keyword injection).
// - Format: Role/Title | [X]+ Years in [Skill1, Skill2, Skill3] | [Short phrase about core expertise from resume]
// - Keep under 220 characters. Title Case. Return ONLY the single headline line.

// Example Output:
// Full Stack Java Developer | 4+ Years in Spring Boot, React, AWS | Building Scalable Microservices & Cloud-Native Applications`;

//     /* ---------------- ABOUT (resume-only) ---------------- */
//     case "about":
//       return `Task:

// Write a LinkedIn ABOUT summary using ONLY details from [Resume_Text].
// - The very first line MUST include: Most Recent Role/Title · [X]+ Years of Experience.
// - The value [X] must be copied EXACTLY as written in the resume. 
// - If the resume does not explicitly state years of experience, OMIT the years of experience completely (do NOT estimate or infer).
// - Summarize the scope of experience, domains, technologies/tools, and measurable outcomes strictly from the resume.
// - STRICT: Do not add external keywords, do not use the target role, do not use job descriptions, and do not invent or assume anything not in the resume.
// - 3–6 short paragraphs OR 6–10 concise bullets (choose one format).
// - Use **exact values** from the resume without modifying, rounding, or approximating them.
// - No invented claims; only include what is explicitly present in the resume.
// - Plain text only (no Markdown, no formatting symbols).`;


//     /* ---------------- EXPERIENCE (per-button) ---------------- */
//    case "experience":
//   return `Task:
// Write the ENTIRE LinkedIn EXPERIENCE section using ONLY [Resume_Text].
// Goal: produce a recruiter-friendly Experience section that covers ALL relevant employers and roles in reverse-chronological order.

// Output rules (plain text only, no markdown):
// - For EACH company (most recent first), output this EXACT structure, then leave ONE blank line before the next company:
//   Title | Company | Location | Dates
//   - 4–7 bullets for that company/role group.
//   Key Achievements
//   • 1–3 bullet points with metrics or quantifiable outcomes for THIS company only.

// STRICT per-company rules for "Key Achievements":
// - You MUST evaluate EACH company independently. If the resume contains measurable outcomes/metrics/results anywhere for that same company (including within its bullets), include the "Key Achievements" sub-block right under that company's bullets.
// - If the resume has NO measurable outcomes for that particular company, OMIT the "Key Achievements" sub-block ONLY for that company. Do NOT omit it for other companies that do have metrics.
// - This check is repeated for EVERY company so that multiple companies can each have their own "Key Achievements" if supported by the resume.

// General constraints:
// - Use ONLY facts from the resume (tools/stack, systems, scope, outcomes, metrics if shown). Do not invent any details.
// - If a field (title/company/location/dates/metrics) is missing in the resume, omit that field. Do not guess.
// - Bullets must be concise and start with a strong verb (Implemented, Built, Led, Optimized, Automated, Designed, Developed, Integrated, Migrated, Reduced, Improved, Delivered).
// - If metrics exist (%, counts, time, cost), put the outcome first (e.g., "- Reduced build times by 35% by …").
// - "Key Achievements" bullets must begin with "• " (bullet character + space).
// - No sub-bullets beyond this, no emojis, no extra headers.

// Important:
// - Cover ONLY work experience/employment. Exclude Education, Projects, Certifications, Summary, Skills.
// - Preserve resume wording and casing for titles/companies as printed.
// - Return only the Experience content as plain text, with a SINGLE blank line separating each company block.`;


//     /* ---------------- INTERNSHIP (per-button) ---------------- */
//     case "internship":
//       return `Task:
// Write ONE LinkedIn EXPERIENCE entry for an INTERNSHIP using ONLY [ROLE CONTEXT] (if present). If [ROLE CONTEXT] is missing, infer just ONE internship from [Resume_Text].
// - Output strictly for ONE internship.
// - Format (plain text only, no markdown):
// Title | Company | Location | Dates
// - 3–6 bullets focusing on tools used, what you built, and measured impact (facts only).
// - STRICT: Do not invent any details. Omit missing fields.`;

//     /* ---------------- EXPERIENCE BUTTONS: STRICT JSON ---------------- */
//     case "experience_buttons":
//       return `Extract WORK EXPERIENCE only. Use sections titled like "Professional Experience", "Experience", "Work Experience", "Employment History", "Work History".
// Exclude Education, Projects, Certifications, Publications, Skills, Summary, and header/footer/contact lines.

// Return ONLY valid JSON (no markdown, no commentary):
// {
//   "items": [
//     {
//       "company": "Company As Printed",
//       "company_normalized": "company-as-printed lowercased trimmed",
//       "roles": [
//         {
//           "title": "Role Title",
//           "location": "City, ST or Country",
//           "start": "Any date format from resume (e.g., 04/2022, Apr 2022, 2022)",
//           "end": "Any date format from resume or Present",
//           "bullets": ["Factual bullet from resume", "..."],
//           "raw": "Condensed raw lines corresponding to this role"
//         }
//       ]
//     }
//   ]
// }
// Rules:
// - Merge multiple stints at the same company into one company object (multiple roles).
// - Preserve resume wording; do not invent data.
// - If any field is missing, use an empty string.
// - Output ONLY JSON.`;

//     /* ---------------- INTERNSHIP BUTTONS: STRICT JSON ---------------- */
//     case "internship_buttons":
//       return `Extract INTERNSHIP experience only (titles with "Intern", "Internship" or clearly internships).
// Exclude non-internship roles and all other sections.

// Return ONLY valid JSON (no markdown, no commentary):
// {
//   "items": [
//     {
//       "company": "Company As Printed",
//       "company_normalized": "company-as-printed lowercased trimmed",
//       "roles": [
//         {
//           "title": "Intern Title",
//           "location": "City, ST or Country",
//           "start": "Any date format",
//           "end": "Any date format or Present",
//           "bullets": ["Factual bullet from resume"],
//           "raw": "Condensed raw lines for this internship"
//         }
//       ]
//     }
//   ]
// }
// Rules:
// - Preserve wording; do not invent.
// - If a field is missing, use an empty string.
// - Output ONLY JSON.`;

//     /* ---------------- PROJECTS / EDUCATION / SKILLS / CERTS / BANNER (unchanged) ---------------- */
//     case "projects":
//       return `Task:
// Write the PROJECTS section using ONLY projects listed in [Resume_Text].
// - Include exactly as many distinct projects as exist in the resume (no extra, no missing).
// - For each project: Name – technologies used (in parentheses) – followed by 2–4 bullets with stack, responsibilities, and outcomes explicitly present in the resume.
// - STRICT: Do not insert projects, tools, or metrics not present in the resume. Plain text only.

// Example Output:
// PROJECTS

// Placement Management Portal – (Flask, MySQL, AWS EC2)
// • Developed Flask-based APIs with a MySQL backend to manage student data and recruiter access, ensuring secure role-based authentication.
// • Achieved 99.9% uptime post-deployment on AWS EC2, improving recruiter-student coordination efficiency by 35%.

// IoT Device Monitoring Dashboard – (Spring Boot, WebSockets, MQTT, MySQL)
// • Built a real-time monitoring dashboard for 50+ IoT devices, reducing fault detection times by 40%.
// • Integrated MQTT broker with Spring Boot microservices and MySQL backend for millisecond-level data processing.

// Sentiment Analysis of Product Reviews – (Python, NLTK, Scikit-learn, Pandas)
// • Designed a text classification pipeline achieving 87% precision in sentiment detection for over 5,000 product reviews.
// • Applied TF-IDF vectorization and automated preprocessing using Pandas and NumPy, improving model accuracy.

// Student Attendance System – (OpenCV, Python Flask, MySQL, Heroku)
// • Developed a facial recognition attendance system with 95% recognition accuracy for 200+ students.
// • Integrated real-time analytics dashboards using Chart.js and deployed securely on Heroku.
//   `;

//     case "education":
//       return `Task:
// Write the EDUCATION section using ONLY degrees listed in [Resume_Text] (ignore certifications, diplomas, and any other non-degree qualifications).
// - Include exactly as many entries as the resume has (no extra, no missing).
// - For each entry: Degree | School | Location | Dates (only if present in the resume).
// - If present, add 1–2 bullets for relevant coursework or key academic projects.
// - STRICT: Do not add certifications, diplomas, or any other fields not present in the resume. Only include degrees and education-related information.
// - The output must follow the format below. Do not add any other details.

// Example Output:
// EDUCATION

// Master of Science in Information Technology – University of Missouri–Kansas City (2023)
// Relevant Coursework: Cloud Computing, Advanced Software Engineering, Data Visualization  
// Key Academic Project: Developed a Flask + MySQL placement portal deployed on AWS EC2, achieving 99.9% uptime and streamlining recruiter-student interactions.

// Bachelor of Technology in Information Technology – Anurag Group of Institutions (2022)
// Relevant Coursework: Data Structures & Algorithms, Database Management Systems, Web Development  
// Key Academic Project: Built a real-time Spring Boot + MQTT IoT monitoring dashboard for 50+ devices, reducing fault detection times by 40%.
//   `;

//     case "education_item":
//       return `Task:
// Write a SINGLE education entry using ONLY [ROLE CONTEXT] (if provided) OR otherwise ONLY [Resume_Text].
// - Format: Degree | School | Location | Dates (only if present in the resume).
// - Add 1–2 bullets ONLY if they are present in the resume for this entry (Relevant Coursework, Key Academic Project).
// - STRICT: No target role, no JD keywords, no certifications, no additions. Plain text only.
// - The output must follow the format below. Do not add any other details.

// Example Output:
// Master of Science in Information Technology – University of Missouri–Kansas City (2023)
// Relevant Coursework: Cloud Computing, Advanced Software Engineering, Data Visualization  
// Key Academic Project: Developed a Flask + MySQL placement portal deployed on AWS EC2, achieving 99.9% uptime and streamlining recruiter-student interactions.
//   `;

//     case "skills":
//       return `Task:
// Write the SKILLS section using ONLY skills present in [Resume_Text].
// - Group skills by categories if those categories are implied by the resume (e.g., Languages, Frameworks, Tools). 
// - STRICT: Do not add any new skills; keep names as they appear in the resume (canonicalize simple duplicates).
// - Output as a comma-separated list.
// - Include a list of "Endorsement Priority" skills (most critical skills) in a separate line below the list of skills.

// Example Output:
// SKILLS
//   Java 17, Spring Boot, Microservices Architecture, RESTful APIs, React.js, Amazon Web Services (AWS EC2, S3, Lambda, RDS), Docker, Jenkins, CI/CD Pipelines, MySQL, Spring MVC, Hibernate, J2EE, Maven, Gradle, JavaScript, HTML5, CSS3, Bootstrap, jQuery, Oracle Database, MongoDB, JUnit 5, Mockito, REST Assured, Selenium, Postman, JMeter, ELK Stack (Elasticsearch, Logstash, Kibana), AWS CloudWatch, Log4j, Terraform, GitHub Actions, SQL Server, GitLab, Bitbucket.

// Endorsement Priority: Java 17, Spring Boot, Microservices Architecture, RESTful APIs, React.js, AWS, Docker, Jenkins, CI/CD Pipelines, MySQL
//   `;

//     case "certifications":
//       return `Task:
// Write the CERTIFICATIONS section using ONLY items present in [Resume_Text].
// - STRICT: Do NOT add any new certifications.
// - STRICT: Only include years/dates if they are present in the resume; if years/dates are shown, return "Name – Issuer (Year)" (omit issuer if not present).
// - Keep exactly as many certifications as in the resume (no extra). Plain text only.`;

//     case "banner":
//       return `Task:
// Suggest 2–3 LinkedIn banner concepts and one AI-image prompt (1584×396), modern corporate look.
// - Keep suggestions generic; DO NOT reference JD or target role.`;

//     default:
//       return `Task:
// Produce the requested LinkedIn section in plain text only. No *, _, or backticks. Bullets (if any) must start with "- ". Use ONLY the resume.`;
//   }
// }

// /* -------------------------- Prompt builder (unchanged except we sanitize resume) -------------------------- */

// function buildPrompt(opts: {
//   section: string;
//   targetRole: string;
//   resumeText: string;
//   jobDescription?: string;
//   industry?: string;
//   keywords?: string[];
//   variation: number;
//   avoidText: string;
//   nonce: string;
//   subIndex?: number;
//   roleContext?: {
//     title?: string;
//     company?: string;
//     location?: string;
//     start?: string;
//     end?: string;
//     bullets?: string[];
//     raw?: string;
//   } | null;
// }) {
//   const {
//     section, targetRole, resumeText, jobDescription, industry,
//     keywords, variation, avoidText, nonce, subIndex, roleContext,
//   } = opts;

//   const hasRoleContext = !!(roleContext && (roleContext.title || roleContext.company));
//   const roleBlock =
//     hasRoleContext && (section === "experience" || section === "internship" || section === "education_item")
//       ? `
// ### ROLE CONTEXT (WRITE ONLY THIS ITEM)
// Title/Degree: ${roleContext?.title || ""}
// Company/School: ${roleContext?.company || ""}
// Location: ${roleContext?.location || ""}
// Dates: ${roleContext?.start || ""} - ${roleContext?.end || ""}
// Hints/Bullets:
// ${Array.isArray(roleContext?.bullets) && roleContext!.bullets!.length
//   ? roleContext!.bullets!.map(b => `- ${String(b)}`).join("\n")
//   : "(none)"}
// Raw:
// ${roleContext?.raw || "(none)"}
// `
//       : "";

//   const resumeTextSanitized = sanitizeResume(resumeText || "");

//   const dataBlock = `
// ### DATA (for reference only; follow each section's STRICT rules)
// [Target_Role]: ${targetRole || "(empty)"}    // DO NOT USE in content
// [Resume_Text]: ${resumeTextSanitized || "(empty)"}
// [Job_Description_Text]: (empty)
// [Industry]: ${industry || "(empty)"}         // DO NOT USE
// [Keywords]: (none)
// ${roleBlock}
// `;

//   return `${header()}

// ${sectionPrompt(section, subIndex, hasRoleContext)}

// ${dataBlock}

// ### Additional constraints
// - Variation index: ${variation}
// - Avoid repeating phrases: ${avoidText || "(none)"}
// - Nonce: ${nonce || "(none)"} (this is just a randomness hint; do not print it)
// `;
// }

// /* -------------------------- LLM calls -------------------------- */

// async function callGemini(prompt: string): Promise<string> {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
//   const genAI = new GoogleGenerativeAI(apiKey);
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//   const resp = await model.generateContent(prompt);
//   const txt = resp.response?.text?.() ?? "";
//   return txt.trim();
// }

// /** JSON mode for *_buttons so the model returns pure JSON (no prose or fences) */
// async function callGeminiJSON(prompt: string): Promise<string> {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
//   const genAI = new GoogleGenerativeAI(apiKey);
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//   const resp = await model.generateContent({
//     contents: [{ role: "user", parts: [{ text: prompt }] }],
//     generationConfig: { responseMimeType: "application/json" },
//   } as any);
//   const txt = resp.response?.text?.() ?? "";
//   return txt.trim();
// }

// /* -------------------------- JSON helpers -------------------------- */

// function safeExtractJSON(text: string): any | null {
//   try { return JSON.parse(text); } catch {}
//   const obj = text.match(/\{[\s\S]*\}/);
//   if (obj) { try { return JSON.parse(obj[0]); } catch {} }
//   const arr = text.match(/\[[\s\S]*\]/);
//   if (arr) { try { return JSON.parse(arr[0]); } catch {} }
//   return null;
// }

// /* -------------------------- POST handler -------------------------- */

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // Backward compatibility shims:
//     const section: string = body.section;
//     const targetRole: string = body.targetRole || "";
//     const resumeText: string = body.resumeText || "";
//     const jobDescription: string = body.jobDescription ?? body.jobDescriptionText ?? "";
//     const industry: string = body.industry ?? "";
//     const variation: number = typeof body.variation === "number" ? body.variation : 0;
//     const avoidText: string = body.avoidText ?? "";
//     const nonce: string = body.nonce ?? "";
//     const keywords: string[] = Array.isArray(body.keywords) ? body.keywords : [];
//     const subIndex: number | undefined = typeof body.subIndex === "number" ? body.subIndex
//                          : (typeof body.itemIndex === "number" ? body.itemIndex : undefined);
//     const roleContext = body.roleContext || null;

//     if (!section) throw new Error("Missing 'section'");
//     // Do NOT enforce targetRole; buttons/experience often don't send it.

//     const prompt = buildPrompt({
//       section,
//       targetRole,
//       resumeText,
//       jobDescription,
//       industry,
//       keywords,
//       variation,
//       avoidText,
//       nonce,
//       subIndex,
//       roleContext,
//     });

//     const isButtons = section === "experience_buttons" || section === "internship_buttons";

//     if (isButtons) {
//       // 1) Ask Gemini for pure JSON
//       const rawJson = await callGeminiJSON(prompt);

//       // 2) Parse it safely
//       const parsed = safeExtractJSON(rawJson);
//       const rawItems = parsed && !Array.isArray(parsed) && parsed.items ? parsed.items : parsed;

//       // 3) Canonicalize: drop noise, require valid roles, merge duplicates
//       const items = canonicalizeItems(rawItems);

//       // 4) Return as JSON string (your UI parses it client-side)
//       // If your frontend expects { text }, change 'content' -> 'text' here.
//       return NextResponse.json({ content: JSON.stringify(items || []) }, { status: 200 });
//     }

//     // Non-buttons sections
//     const raw = await callGemini(prompt);
//     const cleaned = sanitizeLLMText(raw);
//     return NextResponse.json({ content: cleaned }, { status: 200 });
//   } catch (e: any) {
//     console.error("generate-section error:", e);
//     return NextResponse.json(
//       { error: e?.message || "Generation failed", detail: String(e) },
//       { status: 500 }
//     );
//   }
// }


// app/api/generate-section/route.ts
// ✅ OpenAI Responses API (no max_tokens/temperature issues). Supports JSON-like mode for *_buttons
//    via instruction-only, resume sanitization, company canonicalization, and strict plain-text outputs.

import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  pickBySection,
  pickAuto,
  countTokens,
  estimateCostINR,
} from "@/lib/modelPicker";
import type { LLMModel } from "@/lib/modelPicker";
import { sanitizeLLMText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- OpenAI client ----------
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// ---------- System prompt ----------
const SYSTEM_PROMPT =
  "You are a LinkedIn optimization expert with 15+ years in corporate career branding for ApplyWizz. Write corporate, recruiter-friendly, keyword-rich content with measurable outcomes. Output plain text only unless JSON is explicitly required.";

/* -------------------------- Prompt helpers (unchanged for non-experience) -------------------------- */

function header() {
  return `You are a LinkedIn optimization expert with 15+ years in corporate career branding for ApplyWizz.
Write corporate, recruiter-friendly, keyword-rich content with measurable outcomes.

Formatting rules (VERY IMPORTANT):
- Plain text only. Do NOT use *, _, #, markdown code fences, or backticks.
- Bullets (if any) must start with "- " (dash+space) — no emojis.
- Never invent facts. [Resume_Text] is your ONLY source of truth for achievements, roles, and skills.
- Use [Job_Description_Text] and [Target_Role] ONLY for keyword optimization and tone; NEVER treat JD requirements as things the user has done if they aren't in the resume.
- If a requested detail is missing from the resume, OMIT it instead of guessing.`;
}

function whichItem(subIndex?: number) {
  if (typeof subIndex !== "number" || subIndex < 0)
    return "Write the MOST RECENT role.";
  const n = subIndex + 1;
  if (n === 1) return "Write the MOST RECENT role.";
  return `Write the ${n}th most recent role (ensure it is distinct from earlier roles).`;
}

/* -------------------------- PDF/Text sanitization -------------------------- */

function sanitizeResume(text: string = ""): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\uFFFD/g, "-")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[•▪·●■]/g, "-")
    .replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/g, "$1$2")
    .replace(/([^\n])\n(?!\n|- |\* |\d+\. )/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\by=ars\b/gi, "years")
    .replace(/\by-ears\b/gi, "years")
    .trim();
}

/* -------------------------- STRICT filter for company buttons -------------------------- */

function normalizeCompanyName(raw: string = ""): string {
  return raw
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[@]/g, " at ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /\b(llc|inc|incorporated|corp|corporation|ltd|co|plc|pvt|private|limited)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function isBadCompanyName(name: string = ""): boolean {
  const n = (name || "").trim();
  if (!n) return true;

  const lower = n.toLowerCase();

  if (["linkedin", "github", "portfolio"].includes(lower)) return true;

  const badTokens = [
    "professional summary",
    "summary",
    "objective",
    "projects",
    "project",
    "education",
    "certifications",
    "skills",
    "technical skills",
    "contact",
    "phone",
    "email",
    "achievements",
    "awards",
    "publications",
  ];
  if (badTokens.some((t) => lower.includes(t))) return true;

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(n)) return true;
  if (lower.includes("http") || lower.includes("www.")) return true;

  if (/^\s*[A-Za-z .-]+,\s*[A-Za-z .-]+\s*$/.test(n)) return true;

  const letters = n.replace(/[^a-z]/gi, "");
  if (letters && !/[aeiou]/i.test(letters) && letters.length >= 5) return true;

  return false;
}

function isValidRole(role: any): boolean {
  if (!role || typeof role !== "object") return false;
  const hasTitle = !!(role.title && String(role.title).trim());
  const hasBullets =
    Array.isArray(role.bullets) &&
    role.bullets.some((b: any) => String(b || "").trim());
  return hasTitle || hasBullets;
}

function canonicalizeItems(input: any): Array<any> {
  const arr: any[] = Array.isArray(input) ? input : [];
  const byKey: Record<string, any> = {};

  for (const item of arr) {
    const companyRaw = String(item?.company || "").trim();
    if (!companyRaw || isBadCompanyName(companyRaw)) continue;

    const key = normalizeCompanyName(companyRaw);
    if (!key) continue;

    const roles = Array.isArray(item?.roles)
      ? item.roles.filter(isValidRole)
      : [];
    if (roles.length === 0) continue;

    if (!byKey[key]) {
      byKey[key] = {
        company: companyRaw,
        company_normalized: key,
        roles: [],
      };
    }
    byKey[key].roles.push(...roles);
  }

  Object.values(byKey).forEach((obj: any) => {
    obj.roles.sort((a: any, b: any) =>
      String(a.start || "").localeCompare(String(b.start || ""))
    );
  });

  return Object.values(byKey);
}

/* -------------------------- section prompts (unchanged text) -------------------------- */

function sectionPrompt(section: string, _subIndex?: number, _hasRoleContext?: boolean) {
  switch (section) {
    case "headline":
      return `Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create a "HEADLINE" for a LinkedIn profile.

### Formula:
[Professional Identity] | [Years of Experience + 3 Core Skills from Resume] | [High-Value keywords/Achievements]

### Constraints:
- **Title/Identity**: Extract the candidate's professional identity/title STRICTLY from the "PROFESSIONAL SUMMARY" or "SUMMARY" section of the [Resume_Text]. Look for how they describe themselves in the first sentence (e.g., "Construction Management professional").
- **Experience**: Use the value from [Exact_Years_From_Resume]. Include it as "X+ Years" or "X Years" in the headline.
- **Skills**: Pick the 3 most relevant skills from [Resume_Text] that align with the [Job_Description_Text].
- **SEO**: Integrate 2-3 keywords from [Job_Description_Text] ONLY if they exist in [Resume_Text].
- **Format**: Plain text only. Under 220 characters. No dates in the title. Title Case.

Logic:
1. Identify the professional identity from the Summary section of [Resume_Text].
2. Add [Exact_Years_From_Resume] and top skills from [Resume_Text].
3. Add key specialized skills from [Job_Description_Text] that the candidate actually has.
4. Ensure the resulting line is concise and professional.

Example:
Construction Management Professional | 2+ Years in Civil Construction, Project Controls & Budgeting | Procore, Primavera P6 & BIM 360 Expert`;

    case "about":
      return `Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create an "ABOUT" section for a LinkedIn profile.

Constraints:
- 3 short paragraphs:
  1. Intro: Total years of experience, specialization, and core value proposition (from Resume).
  2. Body: Skills and measurable achievements (quantified results) STRICTLY from [Resume_Text].
  3. Closing: Career vision and alignment with [Target_Role].
- Use ONLY facts from [Resume_Text]. Never invent achievements or metrics.
- Naturally integrate high-value keywords from [Job_Description_Text] ONLY where they match the user's actual skills in [Resume_Text].
- Reads like a narrative, not a bullet list.
- Corporate, formal, and recruiter-friendly.
- Ensure it is under 2,000 characters.

Logic:
1. Identify years of experience and specialization from [Resume_Text].
2. Extract most impactful achievements and technologies STRICTLY from [Resume_Text].
3. Use [Job_Description_Text] to select which existing skills to emphasize.
4. Structure into 3 professional paragraphs.

Example Structure (Do not copy these specific facts):
With over [X] years of experience in [Domain], I specialize in [Skills]...
At [Company], I [quantifiable achievement from resume]...
I am now looking to leverage my expertise in [Skill] for [Target_Role] roles...`;

    case "experience":
      return `Task:
From the [Resume_Text], create a professional LinkedIn "EXPERIENCE" section optimized for [Target_Role].

### STRICT RULES:
- Use ONLY facts (titles, companies, metrics, tools) present in [Resume_Text].
- NEVER invent achievements or pull requirements from [Job_Description_Text] as if they were candidate achievements.
- Use [Job_Description_Text] ONLY to prioritize keywords or phrase existing resume bullets more effectively.

### Role Formatting:
- Job Title
- Company Name | Location | Dates
- A 1–2 sentence introduction summarizing role scope and impact (from Resume).

### Bullets:
- 4–6 strong achievement bullets per role.
- Each bullet MUST:
  - Start with a powerful action verb.
  - Quantify results STRICTLY based on [Resume_Text] metrics.
  - Bold key tools/technologies mentioned in [Resume_Text].
  - Focus on outcomes.

### Key Achievements:
- Add a "Key Achievements" subsection ONLY if [Resume_Text] contains 2–3 standout quantified wins for that role.

Logic:
1. Identify job titles, companies, locations, and dates from [Resume_Text].
2. Extract measurable achievements and tools STRICTLY from [Resume_Text].
3. Phrase bullets to include relevant keywords from [Job_Description_Text] ONLY if they apply to the candidate's actual work.
4. Keep each role concise yet impactful.`;

    case "internship":
      return `Task:
Write ONE LinkedIn EXPERIENCE entry for an INTERNSHIP using ONLY [ROLE CONTEXT] (if present) else infer ONE internship from [Resume_Text].
Format:
Title | Company | Location | Dates
- 3–6 bullets focusing on tools used, what you built, and measured impact.
- Omit missing fields. Plain text only.`;

    case "experience_buttons":
      return `Extract WORK EXPERIENCE only from the resume sections (Experience / Work History / etc). Exclude Education / Projects / Skills / etc.
Return ONLY valid JSON (no markdown, no commentary):
{
  "items": [
    {
      "company": "Company As Printed",
      "company_normalized": "company-as-printed lowercased trimmed",
      "roles": [
        {
          "title": "Role Title",
          "location": "City, ST or Country",
          "start": "Any date format from resume",
          "end": "Any date format or Present",
          "bullets": ["Factual bullet from resume"],
          "raw": "Condensed raw lines corresponding to this role"
        }
      ]
    }
  ]
}
Rules:
- Merge multiple stints at the same company into one company object (multiple roles).
- Preserve resume wording; do not invent data.
- If any field is missing, use an empty string.
- Output ONLY JSON.`;

    case "internship_buttons":
      return `Extract INTERNSHIP experience only. Exclude non-internship roles and other sections.
Return ONLY valid JSON (no markdown, no commentary):
{
  "items": [
    {
      "company": "Company As Printed",
      "company_normalized": "company-as-printed lowercased trimmed",
      "roles": [
        {
          "title": "Intern Title",
          "location": "City, ST or Country",
          "start": "Any date format",
          "end": "Any date format or Present",
          "bullets": ["Factual bullet from resume"],
          "raw": "Condensed raw lines for this internship"
        }
      ]
    }
  ]
}
Rules:
- Preserve wording; do not invent.
- If a field is missing, use an empty string.
- Output ONLY JSON.`;

    case "projects":
      return `Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create a "PROJECTS" section for a LinkedIn profile that:
- Lists only role-relevant academic, freelance, or personal projects that demonstrate skills for the target role.
- Uses the format: Project Title – (Tools & Tech Used)
- Each project should have 2–3 bullet points starting with action verbs.
- Each bullet must highlight measurable results, real-world impact, or performance improvements.
- Bold key tools & technologies inline for LinkedIn SEO (e.g., Spring Boot, AWS EC2, React.js).
- Avoid “student project” language; make it outcome-driven and professional.
- Keep it concise, corporate, and recruiter-friendly.

Logic:
1. From [Resume_Text], identify projects that use tools, technologies, or skills from [Job_Description_Text].
2. Reframe each project as a professional achievement with tangible results.
3. Highlight relevant keywords for LinkedIn search optimization.
4. Remove filler words; focus on impact and skills.`;

    case "education":
      return `Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create an "EDUCATION" section for a LinkedIn profile that:
- Lists degrees in reverse chronological order (most recent first).
- Includes: Degree Name, University Name, Graduation Year (if available).
- Adds 1–2 lines of relevant coursework, academic projects, or specializations aligned to the target role.
- Avoids irrelevant subjects or overly generic phrases like “completed coursework in...”.
- Presents academic projects as outcome-driven achievements rather than student work.
- Uses corporate, recruiter-friendly formatting without abbreviations unless standard (e.g., B.Tech).

Logic:
1. Extract degree details from [Resume_Text].
2. Match relevant courses/projects to skills in [Job_Description_Text].
3. Reframe academic projects in impact + tools + results format if worth including.
4. Keep the section clean and easy to scan for recruiters.`;

    case "skills":
      return `Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create a "SKILLS" section for a LinkedIn profile that:
- Lists a minimum of 30 role-relevant skills based on the client’s resume and the job description.
- Prioritizes high-value keywords recruiters search for in the target role.
- Groups skills into logical categories: Backend Development, Frontend Development, Cloud & DevOps, Databases, Testing & QA, Monitoring & Logging.
- Bold the top 10 skills that should be prioritized for LinkedIn endorsements.
- Avoids soft skills (e.g., teamwork, communication) unless explicitly requested.
- Formats the output as a clean, comma-separated list for direct LinkedIn input, followed by an endorsement priority note.

Logic:
1. Extract technical skills and tools from [Resume_Text].
2. Compare with [Job_Description_Text] to identify missing but relevant skills.
3. Select the most important 30–35 for LinkedIn SEO.
4. Bold the top 10 most in-demand and role-defining skills for endorsement focus.`;

    case "certifications":
      return `Task:
From the [Target_Role] and [Resume_Text], create a "CERTIFICATIONS" section that:
- Contains a maximum of 6 certifications
- Only includes certifications relevant to the target role
- Selects from trusted providers such as LinkedIn Learning, Coursera, DataCamp, AWS, IBM, Google, Microsoft, etc.
- Prioritizes certifications covering missing or in-demand skills from the target role’s job description
- Avoids any "(Free Audit Available)" or cost-related mentions
- Uses clean recruiter-friendly formatting: [Certification Name] – [Issuing Organization] (Year if available)

Logic:
1. Extract technical skills & tools from [Target_Role] + [Job_Description_Text].
2. Compare with skills in [Resume_Text].
3. If a skill is missing, recommend a certification that covers it from a trusted provider.
4. List certifications that enhance credibility for the role.`;

    case "banner":
      return `Task:
Suggest 2–3 LinkedIn banner concepts and one AI-image prompt (1584×396), modern corporate look.
- Keep suggestions generic; do NOT reference JD or target role. Plain text only.`;

    default:
      return `Task:
Produce the requested LinkedIn section in plain text only. Bullets must start with "- ". Use ONLY the resume.`;
  }
}

/* -------------------------- YoE extractor (STRICT, resume-only) -------------------------- */

// Try to reuse the exact string if resume literally says "4+ years", "3 years 6 months", etc.
function findLiteralYoE(resume: string): string | "" {
  const rx = /\b(\d{1,2})(\s*(\+|plus))?\s*(years?|yrs?)(\s+(\d{1,2})\s*(months?|mos?))?\b/gi;
  const hits: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(resume)) !== null) {
    // Keep the original casing/spacing as written in resume
    hits.push(m[0].trim());
  }
  // pick the longest literal match (more informative)
  hits.sort((a, b) => b.length - a.length);
  return hits[0] || "";
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function monthIndex(s: string): number {
  const k = s.toLowerCase();
  return k in MONTHS ? MONTHS[k] : -1;
}

type Interval = { start: Date; end: Date };

// only accept month+year → month+year/Present
function collectIntervals(resume: string): Interval[] {
  const text = resume.replace(/\u00A0/g, " ");
  const intervals: Interval[] = [];
  const now = new Date();

  // e.g., "Mar 2020 - Sep 2023", "March 2018 – Present"
  const rx1 =
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\s*[-–to]+\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Present)\s*(\d{4})?\b/gi;

  let m: RegExpExecArray | null;
  while ((m = rx1.exec(text)) !== null) {
    const matchPos = m.index;
    const lineStart = text.lastIndexOf("\n", matchPos) + 1;
    const lineEnd = text.indexOf("\n", matchPos + m[0].length);
    const currentLine = text.substring(
      lineStart,
      lineEnd === -1 ? text.length : lineEnd
    );

    // Check context (current + previous line) for education markers
    const prevLineStart = text.lastIndexOf("\n", lineStart - 2) + 1;
    const prevLine =
      lineStart > 0 ? text.substring(prevLineStart, lineStart - 1) : "";

    const context = (prevLine + " " + currentLine).toLowerCase();
    const isEdu =
      /\b(bachelor|master|degree|university|school|institute|diploma|academy|college|education|academic)\b/i.test(
        context
      );

    if (isEdu) continue;

    const sm = monthIndex(m[1]);
    const sy = Number(m[2]);
    const endMonthRaw = m[3];
    const endYearRaw = m[4];

    if (sm < 0 || !sy) continue;

    const start = new Date(sy, sm, 1);

    let end: Date | null = null;
    if (/present/i.test(endMonthRaw)) {
      end = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      const em = monthIndex(endMonthRaw);
      const ey = Number(endYearRaw);
      if (em >= 0 && ey) end = new Date(ey, em, 1);
    }
    if (!end) continue;
    if (end < start) continue;

    intervals.push({ start, end });
  }

  // e.g., "03/2020 - 08/2023"
  const rx2 = /\b(\d{1,2})[\/\-\.](\d{4})\s*[-–to]+\s*(\d{1,2}|Present)[\/\-\.]?(\d{4})?\b/gi;
  while ((m = rx2.exec(text)) !== null) {
    const matchPos = m.index;
    const lineStart = text.lastIndexOf("\n", matchPos) + 1;
    const lineEnd = text.indexOf("\n", matchPos + m[0].length);
    const currentLine = text.substring(
      lineStart,
      lineEnd === -1 ? text.length : lineEnd
    );

    const prevLineStart = text.lastIndexOf("\n", lineStart - 2) + 1;
    const prevLine =
      lineStart > 0 ? text.substring(prevLineStart, lineStart - 1) : "";

    const context = (prevLine + " " + currentLine).toLowerCase();
    const isEdu =
      /\b(bachelor|master|degree|university|school|institute|diploma|academy|college|education|academic)\b/i.test(
        context
      );

    if (isEdu) continue;

    const sm = Number(m[1]) - 1;
    const sy = Number(m[2]);
    const endMRaw = m[3];
    const endYRaw = m[4];

    if (sm < 0 || sm > 11 || !sy) continue;
    const start = new Date(sy, sm, 1);

    let end: Date | null = null;
    if (/present/i.test(String(endMRaw))) {
      end = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      const em = Number(endMRaw) - 1;
      const ey = Number(endYRaw);
      if (em >= 0 && em <= 11 && ey) end = new Date(ey, em, 1);
    }
    if (!end) continue;
    if (end < start) continue;

    intervals.push({ start, end });
  }

  return intervals;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (!intervals.length) return [];
  const sorted = intervals
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start.getTime() <= last.end.getTime()) {
      // overlap -> extend end if needed
      if (cur.end.getTime() > last.end.getTime()) last.end = cur.end;
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

function totalMonths(intervals: Interval[]): number {
  let months = 0;
  for (const { start, end } of intervals) {
    const m =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (m > 0) months += m;
  }
  return months;
}

function formatYoEFromMonths(total: number): string {
  const y = Math.floor(total / 12);
  const m = total % 12;
  if (y <= 0 && m <= 0) return "";
  if (y > 0 && m > 0) return `${y} Years ${m} Months`;
  if (y > 0) return `${y} Years`;
  return `${m} Months`;
}

/**
 * Extract a strict YoE string from the resume:
 * 1) Prefer a literal phrase already in the resume (returned exactly as written).
 * 2) Otherwise compute from month+year dated ranges (Present allowed). Exclude ranges without month+year.
 */
function extractExactYearsFromResume(resumeText: string): string {
  const literal = findLiteralYoE(resumeText);
  if (literal) return literal; // use exactly as written in resume

  const intervals = mergeIntervals(collectIntervals(resumeText));
  const months = totalMonths(intervals);
  const computed = formatYoEFromMonths(months);
  return computed; // can be "", "N Years", or "N Years M Months"
}

/* -------------------------- Prompt builder -------------------------- */

function buildPrompt(opts: {
  section: string;
  targetRole: string;
  resumeText: string;
  jobDescription?: string;
  industry?: string;
  keywords?: string[];
  variation: number;
  avoidText: string;
  nonce: string;
  subIndex?: number;
  roleContext?: {
    title?: string;
    company?: string;
    location?: string;
    start?: string;
    end?: string;
    bullets?: string[];
    raw?: string;
  } | null;
}) {
  const {
    section,
    targetRole,
    resumeText,
    jobDescription,
    industry,
    keywords,
    variation,
    avoidText,
    nonce,
    subIndex,
    roleContext,
  } = opts;

  const hasRoleContext =
    !!roleContext && !!(roleContext.title || roleContext.company);

  const roleBlock =
    hasRoleContext &&
      (section === "experience" ||
        section === "internship" ||
        section === "education_item")
      ? `
### ROLE CONTEXT(WRITE ONLY THIS ITEM)
      Title / Degree: ${roleContext?.title || ""}
      Company / School: ${roleContext?.company || ""}
      Location: ${roleContext?.location || ""}
      Dates: ${roleContext?.start || ""} - ${roleContext?.end || ""}
      Hints / Bullets:
${Array.isArray(roleContext?.bullets) && roleContext!.bullets!.length
        ? roleContext!.bullets!.map((b) => `- ${String(b)}`).join("\n")
        : "(none)"
      }
      Raw:
${roleContext?.raw || "(none)"}
      `
      : "";

  const resumeTextSanitized = sanitizeResume(resumeText || "");
  const jd = jobDescription || "";

  // >>> NEW: compute exact YoE from resume (literal or computed from month+year ranges)
  const exactYearsFromResume = extractExactYearsFromResume(resumeTextSanitized) || "";

  const dataBlock = `
### DATA (SOURCE OF TRUTH)
[Resume_Text]: ${resumeTextSanitized || "(empty)"}

### OPTIMIZATION TARGETS
[Target_Role]: ${targetRole || "(empty)"}
[Job_Description_Text]: ${jd || "(empty)"}
[Industry]: ${industry || "(empty)"}
[Keywords]: ${Array.isArray(keywords) && keywords.length ? keywords.join(", ") : "(none)"}
[Exact_Years_From_Resume]: ${exactYearsFromResume || "(empty)"}
${roleBlock}
`;

  return `${header()}

${sectionPrompt(section, subIndex, hasRoleContext)}

${dataBlock}

### Additional constraints
- Variation index: ${variation}
- Avoid repeating phrases: ${avoidText || "(none)"}
- Years-of-experience: If [Exact_Years_From_Resume] is not "(empty)", include it **exactly as written**; if it is "(empty)", do **not** mention years-of-experience at all.
- Nonce: ${nonce || "(none)"} (this is just a randomness hint; do not print it)
`;
}

/* -------------------------- JSON helpers -------------------------- */

function safeExtractJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch { }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) {
    try {
      return JSON.parse(obj[0]);
    } catch { }
  }
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) {
    try {
      return JSON.parse(arr[0]);
    } catch { }
  }
  return null;
}

/* -------------------------- Responses API helpers + fallbacks -------------------------- */

function extractOutputText(res: any): string {
  if (typeof res?.output_text === "string") {
    return res.output_text.trim();
  }
  const outputs = Array.isArray(res?.output) ? res.output : [];
  const pieces: string[] = [];
  for (const o of outputs) {
    const content = Array.isArray(o?.content) ? o.content : [];
    for (const c of content) {
      if (typeof c?.text === "string") pieces.push(c.text);
      else if (typeof c === "string") pieces.push(c);
    }
  }
  const stitched = pieces.join("").trim();
  if (stitched) return stitched;
  if (typeof res?.content === "string") return res.content.trim();
  if (typeof res?.text === "string") return res.text.trim();
  return "";
}

function safeTextModel(m: string | undefined): string {
  const fallback = "gpt-4o-mini";
  if (!m) return fallback;
  const bad =
    /embed|realtime|whisper|tts|audio|vision|image|speech|moderation/i.test(m);
  return bad ? fallback : m;
}

async function fallbackChatPlain(
  model: string,
  userPrompt: string
): Promise<{ text: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
  const resp = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  const text =
    resp?.choices?.[0]?.message?.content?.trim?.() ??
    resp?.choices?.[0]?.message?.content ??
    "";
  const usage = resp?.usage
    ? {
      prompt_tokens: resp.usage.prompt_tokens ?? 0,
      completion_tokens: resp.usage.completion_tokens ?? 0,
    }
    : undefined;
  return { text, usage };
}

async function callOpenAIPlain(
  model: LLMModel,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
  const chosen = safeTextModel(String(model));
  try {
    const res = await openai.responses.create({
      model: chosen,
      instructions: SYSTEM_PROMPT,
      input: userPrompt,
      max_output_tokens: maxTokens,
    });
    const text = extractOutputText(res);
    const usage = res?.usage
      ? {
        prompt_tokens:
          (res.usage as any).input_tokens ??
          (res.usage as any).prompt_tokens ??
          0,
        completion_tokens:
          (res.usage as any).output_tokens ??
          (res.usage as any).completion_tokens ??
          0,
      }
      : undefined;

    if (!text?.trim()) {
      const fb = await fallbackChatPlain(chosen, userPrompt);
      return { text: fb.text, usage: fb.usage };
    }
    return { text, usage };
  } catch {
    const fb = await fallbackChatPlain(chosen, userPrompt);
    return { text: fb.text, usage: fb.usage };
  }
}

async function callOpenAIJSON(
  model: LLMModel,
  userPrompt: string,
  maxTokens: number
): Promise<{ jsonText: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
  const chosen = safeTextModel(String(model));
  try {
    const res = await openai.responses.create({
      model: chosen,
      instructions: SYSTEM_PROMPT,
      input: userPrompt + "\n\nReturn ONLY valid JSON.",
      max_output_tokens: maxTokens,
    });
    const jsonText = extractOutputText(res);
    const usage = res?.usage
      ? {
        prompt_tokens:
          (res.usage as any).input_tokens ??
          (res.usage as any).prompt_tokens ??
          0,
        completion_tokens:
          (res.usage as any).output_tokens ??
          (res.usage as any).completion_tokens ??
          0,
      }
      : undefined;

    if (!jsonText?.trim()) {
      const fb = await openai.chat.completions.create({
        model: chosen,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt + "\n\nReturn ONLY valid JSON." },
        ],
      });
      const t =
        fb?.choices?.[0]?.message?.content?.trim?.() ??
        fb?.choices?.[0]?.message?.content ??
        "";
      return {
        jsonText: t,
        usage: fb?.usage
          ? {
            prompt_tokens: fb.usage.prompt_tokens ?? 0,
            completion_tokens: fb.usage.completion_tokens ?? 0,
          }
          : undefined,
      };
    }
    return { jsonText, usage };
  } catch {
    const fb = await openai.chat.completions.create({
      model: chosen,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt + "\n\nReturn ONLY valid JSON." },
      ],
    });
    const t =
      fb?.choices?.[0]?.message?.content?.trim?.() ??
      fb?.choices?.[0]?.message?.content ??
      "";
    return {
      jsonText: t,
      usage: fb?.usage
        ? {
          prompt_tokens: fb.usage.prompt_tokens ?? 0,
          completion_tokens: fb.usage.completion_tokens ?? 0,
        }
        : undefined,
    };
  }
}

/* -------------------------- POST handler -------------------------- */

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY", detail: "Set OPENAI_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const section: string = body.section;
    const targetRole: string = body.targetRole || "";
    const resumeText: string = body.resumeText || "";
    const jobDescription: string =
      body.jobDescription ?? body.jobDescriptionText ?? "";
    const industry: string = body.industry ?? "";
    const variation: number =
      typeof body.variation === "number" ? body.variation : 0;
    const avoidText: string = body.avoidText ?? "";
    const nonce: string = body.nonce ?? "";
    const keywords: string[] = Array.isArray(body.keywords)
      ? body.keywords
      : [];
    const subIndex: number | undefined =
      typeof body.subIndex === "number"
        ? body.subIndex
        : typeof body.itemIndex === "number"
          ? body.itemIndex
          : undefined;
    const roleContext = body.roleContext || null;

    const mode: "manual" | "auto" = body.mode === "auto" ? "auto" : "manual";
    const modelOverride: LLMModel | undefined = body.modelOverride;

    if (!section) throw new Error("Missing 'section'");
    if (!resumeText?.trim()) {
      return NextResponse.json(
        { error: "Empty resumeText", detail: "Please provide resume text before generating." },
        { status: 400 }
      );
    }

    const userPrompt = buildPrompt({
      section,
      targetRole,
      resumeText,
      jobDescription,
      industry,
      keywords,
      variation,
      avoidText,
      nonce,
      subIndex,
      roleContext,
    });

    const isButtons =
      section === "experience_buttons" || section === "internship_buttons";

    // Choose model
    let model: LLMModel =
      modelOverride ??
      (mode === "auto"
        ? pickAuto(SYSTEM_PROMPT, userPrompt)
        : pickBySection(section));

    // Max tokens per section (for output)
    const maxTokens =
      section === "about"
        ? 700
        : section === "experience"
          ? 1400
          : section === "headline"
            ? 120
            : isButtons
              ? 1200
              : 600;

    // (Optional) pre-call cost preview
    const inputTokensPreview =
      countTokens(SYSTEM_PROMPT) + countTokens(userPrompt);
    const costPreview = estimateCostINR(model, inputTokensPreview, maxTokens);

    if (isButtons) {
      const { jsonText, usage } = await callOpenAIJSON(
        model,
        userPrompt,
        maxTokens
      );
      const parsed = safeExtractJSON(jsonText);
      const rawItems =
        parsed && !Array.isArray(parsed) && parsed.items
          ? parsed.items
          : parsed;
      const items = canonicalizeItems(rawItems);

      return NextResponse.json(
        {
          content: JSON.stringify(items || []),
          text: JSON.stringify(items || []),
          model,
          tokens: usage || {
            prompt_tokens: inputTokensPreview,
            completion_tokens: 0,
          },
          costPreviewINR: Math.round(costPreview.inr * 100) / 100,
        },
        { status: 200 }
      );
    }

    // Plain text sections
    const { text, usage } = await callOpenAIPlain(model, userPrompt, maxTokens);
    const cleaned = sanitizeLLMText(text || "");

    if (!cleaned.trim()) {
      return NextResponse.json(
        {
          error: "Empty content from model",
          detail:
            "The model returned no text for this prompt even after fallback. Verify resumeText or try a different model.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        content: String(cleaned),
        text: String(cleaned),
        model,
        tokens: usage || {
          prompt_tokens: inputTokensPreview,
          completion_tokens: countTokens(cleaned),
        },
        costPreviewINR: Math.round(costPreview.inr * 100) / 100,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const status =
      Number(e?.status) ||
      Number(e?.response?.status) ||
      500;
    const message =
      e?.error?.message ||
      e?.message ||
      "Generation failed";
    const detail =
      (typeof e?.response?.data === "string" && e.response.data) ||
      (e?.response?.data ? JSON.stringify(e.response.data) : String(e));

    console.error("generate-section error:", message, detail);
    return NextResponse.json(
      { error: message, detail },
      { status }
    );
  }
}


