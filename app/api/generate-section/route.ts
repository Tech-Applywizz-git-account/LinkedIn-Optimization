// app/api/generate-section/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------- Prompt helpers -------------------------- */

function header() {
  return `You are a LinkedIn optimization expert with 15+ years in corporate career branding for ApplyWizz.
Write corporate, recruiter-friendly, keyword-rich content with measurable outcomes.`;
}

function diffBlock(avoidText: string, variation: number, nonce: string) {
  return `

### DIFFERENTIATION (variation ${variation}, nonce ${nonce})
- Your output MUST be materially different from AVOID_TEXT.
- Do not reuse the same sentences, order, or phrasing.
- Vary action verbs, metrics, and structure.

AVOID_TEXT:
"""${avoidText || "(none)"}"""`;
}

function experienceHint(subIndex?: number) {
  if (typeof subIndex !== "number" || subIndex < 0) return "Write the MOST RECENT role.";
  const n = subIndex + 1;
  if (n === 1) return "Write the MOST RECENT role.";
  return `Write the ${n}ᵗʰ most recent role (ensure it is distinct from earlier roles).`;
}

function sectionPrompt(section: string, subIndex?: number) {
  switch (section) {
    case "headline":
      return `Task:
Create a LinkedIn HEADLINE that follows:
[Target Role / Aspiration] | [Years of Experience + Key Skills] | [Role Keywords from JD]
- Include 2–3 high-value JD keywords, <220 chars, Title Case, corporate tone.
Return ONLY the headline line.`;

    case "about":
      return `Task:
Write an ABOUT in 3 short paragraphs:
1) Intro: years, specialization, core value.
2) Body: role-relevant skills + quantified wins (tools/tech).
3) Closing: vision and role alignment.
Integrate 6–8 JD keywords naturally. Max 2,000 chars. No bullets.`;

    case "experience":
      return `Task:
${experienceHint(subIndex)}
Format for the role:
Job Title
Company | Location | Dates
1–2 sentence scope summary
• 4–6 bullets with quantified outcomes; bold key tools inline (e.g., **SQL**, **Python**, **AWS**, **SSIS**)
Add a short "Key Achievements" subsection (1–2 bullets) with metrics.`;

    case "projects":
      return `Task:
Produce 2–4 PROJECTS:
Title – (**Tools**)
• 2–3 bullets each, quantifiable impact, professional tone, bold key tools.`;

    case "education":
      return `Task:
Produce EDUCATION in reverse chronological order with year + 1–2 lines relevant coursework/projects with tools and impact.`;

    case "skills":
      return `Task:
Produce SKILLS (30–35 items) grouped (Backend, Frontend, Cloud/DevOps, Databases, Testing/QA, Monitoring).
Bold top 10. Comma-separated for LinkedIn.`;

    case "certifications":
      return `Task:
List up to 6 CERTIFICATIONS from trusted orgs relevant to the target role (fill gaps from JD). Format: Name – Issuer (Year).`;

    case "banner":
      return `Task:
Suggest 2–3 LinkedIn banner concepts and one AI-image prompt (1584×396), modern corporate look, role-aligned visuals/colors.`;

    default:
      return `Task:
Produce the requested LinkedIn section.`;
  }
}

function buildPrompt(opts: {
  section: string;
  targetRole: string;
  resumeText: string;
  jobDescription: string;
  industry: string;
  keywords: string[];
  variation: number;
  avoidText: string;
  nonce: string;
  subIndex?: number;
}) {
  const {
    section, targetRole, resumeText, jobDescription, industry,
    keywords, variation, avoidText, nonce, subIndex,
  } = opts;

  const dataBlock = `

### DATA
[Target_Role]: ${targetRole || "(empty)"}
[Resume_Text]: ${resumeText || "(empty)"}
[Job_Description_Text]: ${jobDescription || "(empty)"}
[Industry]: ${industry || "(empty)"}
[Keywords]: ${Array.isArray(keywords) && keywords.length ? keywords.join(", ") : "(none)"}
`;

  return `${header()}

${sectionPrompt(section, subIndex)}
${diffBlock(avoidText, variation, nonce)}
${dataBlock}
### OUTPUT
Return ONLY the section content in plain text suitable for LinkedIn.`;
}

/* -------------------------- Provider (Gemini only) -------------------------- */

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1100,
    },
  });

  const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

/* -------------------------- Route -------------------------- */

export async function POST(req: Request) {
  try {
    const {
      section,
      targetRole,
      resumeText,
      jobDescription,
      industry = "",
      variation = 0,
      avoidText = "",
      nonce = "",
      keywords = [],
      subIndex,
    } = await req.json();

    const prompt = buildPrompt({
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
    });

    const txt = await callGemini(prompt);
    return NextResponse.json({ content: txt }, { status: 200 });
  } catch (e: any) {
    console.error("generate-section error:", e);
    return NextResponse.json(
      { error: e?.message || "Generation failed", detail: String(e) },
      { status: 500 }
    );
  }
}
