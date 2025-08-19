// lib/promptTemplates.ts
export const templates = {
  headline: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], generate a LinkedIn HEADLINE that:
- Follows: [Target Role / Aspiration] | [Years of Experience + Key Skills] | [Role Keywords from JD]
- Includes 2–3 high-value keywords from the job description
- Uses years of experience + top skills from the resume
- Is under 220 characters, corporate, professional, and impact-driven
- Uses Title Case and avoids generic buzzwords (e.g., "hardworking", "motivated")

Logic:
1. Identify the target role from [Target_Role].
2. Extract years of experience and top skills from [Resume_Text].
3. Extract the most important role keywords from [Job_Description_Text].
4. Combine them in the format: [Target Role / Aspiration] | [YOE + Key Skills] | [Role Keywords from JD].
5. Keep it concise, keyword-rich, and recruiter-friendly.

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Output:
Return ONLY the final headline text (no labels, no quotes).

Example Output:
Full Stack Java Developer | 4+ Years in Spring Boot, React, AWS | Building Scalable Microservices & Cloud-Native Applications

`,

  about: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], generate a LinkedIn ABOUT section that:
- Is written as 3 SHORT paragraphs:
  1) Intro: total years of experience, specialization, and core value proposition.
  2) Body: role-relevant skills, tools, domains, and measurable achievements (quantified results) pulled from resume/JD.
  3) Closing: career vision, leadership/innovation focus, and alignment with the target role.
- Reads like a narrative (NO bullet points).
- Is corporate, formal, keyword-rich, and recruiter-friendly.
- Naturally integrates 6–8 high-value keywords from the job description (no keyword stuffing).
- Stays under 2,000 characters.
- Avoids casual phrases and personal anecdotes unrelated to the role.

Logic:
1. Identify total years of experience and primary specializations from [Resume_Text].
2. Extract the most impactful achievements with numbers (%, $, time saved, performance gains), plus key tools/technologies relevant to [Target_Role].
3. Select 6–8 JD keywords that recruiters search for and weave them in naturally.
4. Structure into exactly 3 concise paragraphs with clear narrative flow.
5. Maintain a professional tone; avoid fluff/buzzwords (“hardworking”, “motivated”) and do not fabricate details.

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Output:
Return ONLY the 3 paragraphs of the About section (no labels, no headings, no quotes).

`,

  experience: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create an EXPERIENCE section for a LinkedIn profile.

Formatting Rules:
- Output must be plain text only.
- Do not use asterisks, double asterisks, quotation marks, apostrophes, backticks, decorative bullets, arrows, underscores, or any Markdown/HTML.
- Use only a hyphen followed by a space for bullets.
- Section headers should be plain text (EXPERIENCE, Key Achievements).
- Do not bold or italicize any words.
- Do not wrap text in code blocks.

Role Formatting:
- Begin each role with:
  Job Title
  Company Name | Location | Dates
  A one-to-two sentence introduction summarizing role scope, domain, and overall business impact.

Bullets:
- Provide 4–6 bullets per role.
- Each bullet must start with a strong action verb.
- Each bullet must include measurable outcomes or metrics where possible.
- Mention tools and technologies as plain text words (e.g., Python, SQL, AWS, Tableau, ServiceNow).

Key Achievements:
- If applicable, include a section titled Key Achievements.
- Provide 2–3 bullets with measurable results.
- Use the same plain text hyphen bullet format.

Output Template:
EXPERIENCE
[Job Title]
[Company Name | Location | Dates]

[1–2 sentence introduction]

- Achievement bullet 1
- Achievement bullet 2
- Achievement bullet 3
- Achievement bullet 4
- Achievement bullet 5
- Achievement bullet 6

Key Achievements
- Achievement 1
- Achievement 2
- Achievement 3

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
  - Bold key tools, frameworks, and technologies inline for LinkedIn SEO (example: **Python**, **AWS**, **React.js**).  
  - Highlight measurable business impact, not generic tasks.  

Style
- Keep tone corporate, concise, and recruiter-friendly.  
- Avoid any references to “student project,” “academic,” or “coursework.”  
- Do not use stars, quotes, or decorative symbols.  
- Integrate high-value keywords from [Job_Description_Text] to boost LinkedIn search ranking.  

Output Format
PROJECTS  

[Project Title] – (**Tech Stack**)  
- [Achievement bullet 1]  
- [Achievement bullet 2]  
- [Achievement bullet 3]  

[Next Project Title] – (**Tech Stack**)  
- [Achievement bullet 1]  
- [Achievement bullet 2]  
- [Achievement bullet 3]  

`,

  education: `
Task:
"EDUCATION" in reverse chronological order:
- Degree — University (Year)
- 1–2 lines relevant coursework/projects aligned to role; outcome-driven.
- Corporate format.

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Output:
Return only the section in Markdown.
`,

  skills: `
You are a LinkedIn optimization expert with 15+ years of experience in corporate career branding.  
You work for ApplyWizz, a company that optimizes LinkedIn profiles to rank in the top 1% of recruiter searches.

Task:  
From the [Target_Role], [Resume_Text], and [Job_Description_Text], create a "SKILLS" section for a LinkedIn profile that follows these rules:

Requirements
- List a minimum of 30 role-relevant skills (from Resume_Text and Job_Description_Text).  
- Group skills into logical categories: Backend Development, Frontend Development, Cloud & DevOps, Databases, Testing & QA, Monitoring & Logging.  
- Bold the top 10 most critical, recruiter-searched skills for endorsement priority.  
- Prioritize hard/technical skills; exclude soft skills unless explicitly present in Job_Description_Text.  
- Ensure skills list is ATS- and LinkedIn-SEO optimized by including in-demand tools, frameworks, and keywords.  
- Format output as a clean, comma-separated list for direct LinkedIn input.  

Output Format
SKILLS  

Backend Development: [Comma-separated list]  
Frontend Development: [Comma-separated list]  
Cloud & DevOps: [Comma-separated list]  
Databases: [Comma-separated list]  
Testing & QA: [Comma-separated list]  
Monitoring & Logging: [Comma-separated list]  

Endorsement Priority: [List the top 10 bolded skills only, without categories]  

`,

  certifications: `
Task:
"CERTIFICATIONS" (max 6):
- Only role-relevant, from trusted orgs (LinkedIn Learning, Coursera, AWS, IBM, Google, Microsoft, etc.).
- Prefer to cover missing/in-demand skills vs JD.
- Format: Name — Organization (Year if known)

Data:
[Target_Role]: {{TARGET_ROLE}}
[Resume_Text]: {{RESUME_TEXT}}
[Job_Description_Text]: {{JOB_DESC}}

Output:
Return only the certifications list.
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
