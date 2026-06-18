// lib/promptTemplates.ts
export const templates = {
  headline: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
Write a LinkedIn Headline that effectively communicates the candidate's qualifications, work experience, and unique value, optimized to the highest standard by a LinkedIn branding expert.

Format:
[Seniority Level] [Keyword 1] | [Keyword 2] | [Keyword 3] | ... | [Sharing/Doing Phrase]

Instructions:
- Conditionally determine the candidate's experience/seniority level based on [Exact_Years_From_Resume] or [Resume_Text], and prefix the very first keyword in the headline with it:
  - Less than 2 years of experience: Prefix with "Junior" or "Associate" (e.g., "Junior Software Engineer", "Associate Data Analyst").
  - 2 to 5 years of experience: Prefix with "Mid-Level" (e.g., "Mid-Level MERN Developer").
  - 5 to 8 years of experience: Prefix with "Senior" (e.g., "Senior Backend Engineer").
  - 8+ years of experience: Prefix with "Senior", "Lead", or "Principal" depending on their exact roles.
- Extract and highlight the most essential keywords of 1, 2, or 3 words each from the resume [Resume_Text] (such as job titles, core specializations, tools, and technical skills).
- You MUST add all essential keywords that are critical for industry SEO and recruiter search optimization based on the candidate's background.
- Separate each keyword or phrase strictly using a vertical line ("|").
- Every individual keyword or phrase must strictly be short (1 to 3 words maximum).
- End the headline with a custom, high-impact phrase starting with "Sharing..." or similar, describing what the candidate shares, builds, or delivers (e.g., "Sharing Dev Insights, Roadmaps & Coding Tips" or "Sharing Tech Solutions, Best Practices & System Designs").
- Do not repeat or copy sentences verbatim from the resume. Use sophisticated, high-impact corporate terminology.
- STRICTLY FORBIDDEN: Do NOT include the candidate's name or any other personal names in the headline.
- Output ONLY the final headline text (no labels, no quotes, no markdown formatting like asterisks or code fences).

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Output:
`,

  about: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create an "ABOUT" section for a LinkedIn profile that:
- Is written in 3 short paragraphs:
  1. Intro: Years of experience, specialization, and core value proposition.
  2. Body: Role-relevant skills and measurable achievements (quantified results) from [Resume_Text] and [Job_Description_Text].
  3. Closing: Career vision, leadership/innovation focus, and role alignment.
- Reads like a narrative, not a bullet list.
- Is corporate, formal, keyword-rich, and recruiter-friendly.
- Avoids casual phrases and personal anecdotes unrelated to the role.
- Naturally integrates at least 6–8 high-value keywords from [Job_Description_Text] for LinkedIn search optimization.

Logic:
1. Identify total years of experience and areas of specialization from [Resume_Text]. 
2. Extract most impactful achievements, tools, and technologies relevant to [Target_Role].
3. Pull 6–8 high-value keywords from [Job_Description_Text] that recruiters are likely to search.
4. Structure into 3 professional paragraphs with a clear narrative flow. 
5. Ensure it is under 2,000 characters for LinkedIn's About section limit.

CRITICAL INSTRUCTIONS:
- STRICTLY FORBIDDEN: Do NOT include any personal names (including the candidate's own name, managers, colleagues, clients, or references) from the resume in any generated text.
- Do NOT repeat the exact sentences or copy the phrasing from the resume [Resume_Text]. Rephrase all accomplishments, education, and experiences to be completely different from the source text, presenting them with elevated vocabulary and smooth transitions.
- Do not fabricate or invent achievements or credentials. Use ONLY facts/information from the resume [Resume_Text].

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Output:
`,

  experience: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
Improve the LinkedIn Experience section. For each role:
- Identify the Job Title and Company Name.
- Write a concise, impact-focused description.
- Use outstanding vocabulary, professional phrasal verbs, and relevant keywords.
- Present the results/achievements in bullet points (starting with "- ").

Act as an expert corporate resume writer.
CRITICAL INSTRUCTION: STRICTLY do NOT repeat the exact same sentences, descriptions, or phrasing from the resume [Resume_Text], and do not repeat the same words or sentences across the experience section. Rewrite, elevate, and reformulate the content entirely to be different from the source text while preserving the core factual details and metrics. Transform simple task descriptions into high-impact achievements using active phrasal verbs and professional terminology.
- Word strength, vocabulary impact, and phrasing structure must be consistent and equally strong for every bullet point.
- Every single sentence must be highly meaningful, delivering specific value and impact without generic fluff or unnecessary repetition.
STRICTLY FORBIDDEN: Do NOT include any personal names (including the candidate's name, managers, coworkers, or references) from the resume in any experience entry.

Output Template:
EXPERIENCE
[Job Title] at [Company Name]
[Dates and Location, if available]
[Concise, impact-focused description]
- [Result/Achievement Bullet 1]
- [Result/Achievement Bullet 2]
- [Result/Achievement Bullet 3]
`,

  projects: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.  
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:  
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create a "PROJECTS" section for a LinkedIn profile that follows these rules:

Formatting
- Begin section with PROJECTS.  
- Each entry must follow the format:  
  Project Title – (Tools & Tech Used)  
- Use 2–3 concise bullets under each project.  

Bullets
- Each bullet MUST:  
  - Start with a strong action verb (Developed, Automated, Designed, Engineered, Optimized, Implemented, Integrated).  
  - Quantify results wherever possible (percent improvements, time saved, accuracy gained, cost reduced, uptime achieved).  
  - Bold key tools, frameworks, and technologies inline for LinkedIn SEO (example: Python, AWS, React.js).  
  - Highlight measurable business impact, not generic tasks.  

Style
- Keep tone corporate, concise, and recruiter-friendly.  
- Avoid any references to “student project,” “academic,” or “coursework.”  
- Do not use stars, quotes, or decorative symbols.  
- Integrate high-value keywords from [Job_Description_Text] to boost LinkedIn search ranking.  
- STRICTLY FORBIDDEN: Do NOT include any personal names from the resume in any project description.  

Output Format
PROJECTS  

[Project Title] – (Tech Stack)  
• [Achievement bullet 1]  
• [Achievement bullet 2]  
• [Achievement bullet 3]  

[Next Project Title] – (Tech Stack)  
• [Achievement bullet 1]  
• [Achievement bullet 2]  
• [Achievement bullet 3]  

`,

  education: `
Task:
"EDUCATION" in reverse chronological order:
- Degree — University (Location) (Year)
- 1–2 lines relevant coursework/projects aligned to role; outcome-driven.
- Corporate format.
- STRICTLY FORBIDDEN: Do NOT include any personal names in this section.

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Return only the section in Markdown.
`,

  skills: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
Suggest exactly 20 skills that are relevant to the job role "[Target_Role]" and a list of software/tools that are relevant to "[Target_Role]".

Act as a LinkedIn SEO expert.
CRITICAL INSTRUCTION: Do NOT copy the list of skills directly from the resume [Resume_Text]. Instead, analyze the candidate's background and suggest the most strategic, recruiter-friendly professional keywords and skills in advanced English.

Output Format:
Skills: [Skill 1, Skill 2, ..., Skill 20]
Software & Tools: [Tool 1, Tool 2, ...]
`,

  certifications: `
Task:
From the [Resume_Text], create a "CERTIFICATIONS" section that EXACTLY reproduces the certifications already listed in the resume.

STRICT RULES:
- ONLY include certifications that are EXPLICITLY listed in [Resume_Text].
- Do NOT add, recommend, or suggest any new certifications.
- Do NOT modify certification names - reproduce them EXACTLY as they appear in the resume.
- Do NOT add issuing organizations or years unless they are explicitly stated in [Resume_Text].
- If the resume has no certifications section, return "No certifications found in resume."
- Format: List each certification on its own line, exactly as written in the resume.
- Plain text only.

Data:
[Resume_Text]: {{RESUME_TEXT}}

Output:
Return only the certifications list exactly as found in the resume.
`,

  banner: `
Task:
"LinkedIn Banner Concepts" (2–3) for [Target_Role] in [Industry]:
- Minimal, corporate (blue/navy/grey/white), high contrast, role visuals, room for name/role.
- Size: 1584×396
- Include 1 explicit AI image prompt.

Data:
[Target_Role]: {{TARGET_ROLE}}
[Industry]: {{INDUSTRY}}

Output:
BANNER CONCEPTS:
1) ...
2) ...
3) ...

AI Image Prompt:
"..."
`,
} as const;
