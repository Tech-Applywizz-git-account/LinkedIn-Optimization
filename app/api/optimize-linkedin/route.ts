import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic";

// Domain keyword mapping
const DOMAIN_KEYWORDS = {
  AML: [
    "AML",
    "Anti-Money Laundering",
    "KYC",
    "BSA",
    "SAR",
    "Fraud Analyst",
    "Financial Crime",
    "Sanctions",
    "Compliance",
    "Risk Analyst",
    "Risk Management",
  ],
  Data: [
    "Data Analyst",
    "Power BI",
    "Tableau",
    "Data Visualization",
    "SQL",
    "Python",
    "R",
    "Machine Learning",
    "Statistics",
    "Business Intelligence",
  ],
  "Computer Science": [
    "Software Engineer",
    "Full Stack",
    "Frontend",
    "Backend",
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "API Development",
  ],
  "Project Management": [
    "Project Manager",
    "Agile",
    "Scrum",
    "PMP",
    "Stakeholder Management",
    "Risk Management",
    "Budget Management",
    "Team Leadership",
  ],
  Healthcare: [
    "Healthcare",
    "Medical",
    "Clinical",
    "Patient Care",
    "Healthcare Analytics",
    "Medical Records",
    "HIPAA",
    "Healthcare IT",
  ],
  Finance: [
    "Financial Analysis",
    "Financial Modeling",
    "Excel",
    "Financial Reporting",
    "Budgeting",
    "Forecasting",
    "Investment Analysis",
  ],
  Mechanical: [
    "Mechanical Engineering",
    "CAD",
    "SolidWorks",
    "Manufacturing",
    "Quality Control",
    "Lean Manufacturing",
    "Six Sigma",
  ],
  CyberSecurity: [
    "Cybersecurity",
    "Information Security",
    "Network Security",
    "SOC",
    "Incident Response",
    "Risk Assessment",
    "Compliance",
  ],
}

function findRelevantKeywords(targetRole: string): string[] {
  const role = targetRole.toLowerCase()

  // Find matching domain
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((keyword) => role.includes(keyword.toLowerCase()))) {
      return keywords
    }
  }

  // Default keywords based on common terms
  if (role.includes("data")) return DOMAIN_KEYWORDS["Data"]
  if (role.includes("software") || role.includes("developer")) return DOMAIN_KEYWORDS["Computer Science"]
  if (role.includes("project") || role.includes("manager")) return DOMAIN_KEYWORDS["Project Management"]
  if (role.includes("analyst")) return DOMAIN_KEYWORDS["Data"]

  return ["Professional", "Leadership", "Team Collaboration", "Problem Solving", "Communication"]
}

function extractExperience(resumeText: string): number {
  const text = resumeText.toLowerCase()

  // Look for explicit experience statements
  const expPatterns = [
    /(\d+)\+?\s years?\s (?:of\s )?experience/g,
    /(\d+)\+?\s years?\s in/g,
    /experience:\s (\d+)\+?\s years?/g,
  ]

  for (const pattern of expPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      const years = matches.map((match) => {
        const num = match.match(/\d+/)
        return num ? Number.parseInt(num[0]) : 0
      })
      return Math.max(...years)
    }
  }

  // Count job positions as fallback
  const jobIndicators = ["experience", "work history", "employment", "position", "role"]
  let jobCount = 0

  for (const indicator of jobIndicators) {
    const regex = new RegExp(indicator, "gi")
    const matches = text.match(regex)
    if (matches) jobCount += matches.length
  }

  return Math.max(1, Math.floor(jobCount / 2))
}

function generateHeadline(resumeText: string, targetRole: string, keywords: string[]): string {
  const experience = extractExperience(resumeText)
  const expText = experience === 1 ? "1+ Year" : `${experience}+ Years`
  const topKeywords = keywords.slice(0, 3).join(", ")

  return `${targetRole} | Specialized in ${topKeywords} | ${expText} Experience | Delivering Strategic Value`
}

function generateAbout(resumeText: string, targetRole: string, keywords: string[]): string {
  const experience = extractExperience(resumeText)
  const expText = experience === 1 ? "1+ year" : `${experience}+ years`
  const topKeywords = keywords.slice(0, 4).join(", ")

  return `Paragraph 1 (Education & Achievements):
Holding a strong academic foundation in the field of ${targetRole}, I have built my expertise around core areas like ${topKeywords}. I am passionate about solving complex industry problems and have achieved notable academic success in projects related to my domain.

Paragraph 2 (Previous Experience & Projects):
Over my career, including ${expText} of professional experience, I have contributed to key projects and successfully automated workflows. My work across different projects has focused on enhancing efficiency, optimizing database operations, and implementing robust frontend/backend architectures.

Paragraph 3 (Future Goals):
Looking ahead, my goal is to leverage my technical expertise in ${targetRole.toLowerCase()} roles. I aim to drive innovation, work with high-performing teams, and contribute to scaling operations at a forward-thinking organization.`
}

function generateExperience(resumeText: string, targetRole: string, keywords: string[]): string {
  return `[Job Title] at [Company Name]
[Location] | [Duration]
Concise, impact-focused description of the role, utilizing keywords like ${keywords.slice(0, 4).join(", ")}. Designed and delivered complex systems while improving performance.
- Engineered a scalable solution that reduced processing latency by 30% using ${keywords[0] || "SQL"}.
- Collaborated with cross-functional teams to integrate APIs, improving integration efficiency.
- Led data migration project resulting in zero downtime and improved data integrity.

[Previous Job Title] at [Previous Company Name]
[Location] | [Duration]
Impactful role description focusing on development, testing, and optimization of backend services and user interfaces.
- Implemented robust features that increased active user engagement.
- Resolved key system bottlenecks using ${keywords[1] || "Python"}, optimizing overall response times.
- Documented testing procedures, reducing onboarding time for new developers.`
}

function generateProjects(resumeText: string, targetRole: string, keywords: string[]): string {
  return `🚀 STRATEGIC PROJECTS SHOWCASE:

💼 PROJECT OPTIMIZATION FRAMEWORK:
• Choose 2-3 most relevant projects that align with ${targetRole}
• Highlight technical skills: ${keywords.slice(0, 4).join(", ")}
• Demonstrate business impact and problem-solving abilities

📊 RECOMMENDED PROJECT FORMAT:
[Project Name] | [Duration] | [Your Role]
🎯 Challenge: Brief description of the problem or opportunity
🔧 Solution: Technologies and methodologies used (${keywords[0]}, ${keywords[1]})
📈 Impact: Quantifiable results and business value delivered

🌟 EXAMPLE PROJECTS:
1. Data Analytics Dashboard Development
   • Built comprehensive analytics solution using ${keywords[0]}
   • Improved decision-making speed by 40%
   • Reduced manual reporting time by 60%

2. Process Optimization Initiative
   • Led cross-functional team to streamline operations
   • Implemented ${keywords[1]} best practices
   • Achieved 25% cost reduction and improved efficiency

💡 PRO TIPS:
• Include links to live projects or portfolios when possible
• Use relevant technical keywords naturally
• Show progression in complexity and responsibility
• Align projects with your target role requirements`
}

function generateEducation(resumeText: string, targetRole: string, keywords: string[]): string {
  return `🎓 EDUCATION SECTION OPTIMIZATION:

📚 STRATEGIC FORMATTING:
• List most relevant degree first
• Include GPA if 3.5+ or recent graduate
• Highlight relevant coursework for ${targetRole}
• Add academic achievements and honors

🔍 RELEVANT COURSEWORK EXAMPLES:
• Courses related to ${keywords.slice(0, 3).join(", ")}
• Capstone projects demonstrating practical application
• Research projects with measurable outcomes
• Leadership roles in academic organizations

🏆 ADDITIONAL ACADEMIC HIGHLIGHTS:
• Dean's List recognition
• Relevant academic projects and research
• Study abroad or international experience
• Academic scholarships and awards

💡 FORMATTING TIPS:
• Use consistent date format (Month Year - Month Year)
• Include location (City, State)
• Add relevant certifications in this section
• Keep descriptions concise but impactful

📋 EXAMPLE FORMAT:
[Degree] in [Field] | [University Name] | [Graduation Year]
• Relevant Coursework: [List 3-4 courses related to ${targetRole}]
• Academic Achievement: [GPA, honors, or special recognition]
• Key Project: [Brief description of relevant capstone/research project]`
}

function generateSkills(resumeText: string, targetRole: string, keywords: string[]): string {
  const suggestedSkills = [
    ...keywords.slice(0, 10),
    "Project Management",
    "Data Analysis",
    "SQL",
    "Python",
    "API Integration",
    "Software Development",
    "Git",
    "Agile Methodologies",
    "Cloud Computing",
    "Problem Solving"
  ].slice(0, 20);

  return `Skills: ${suggestedSkills.join(", ")}

Software & Tools: Excel, VS Code, Postman, Tableau, Power BI, Jira, GitHub`
}

function generateCertifications(resumeText: string, targetRole: string, keywords: string[]): string {
  return `🏅 STRATEGIC CERTIFICATIONS ROADMAP:

🎯 HIGH-PRIORITY CERTIFICATIONS FOR ${targetRole.toUpperCase()}:

📊 INDUSTRY-SPECIFIC CERTIFICATIONS:
• Google Analytics Certified
• Microsoft Excel Expert Certification
• Tableau Desktop Specialist
• AWS Cloud Practitioner
• Project Management Professional (PMP)

🔍 DOMAIN-SPECIFIC RECOMMENDATIONS:
${keywords
  .slice(0, 3)
  .map((keyword) => `• Certification in ${keyword} or related field`)
  .join("\n")}

💼 PROFESSIONAL DEVELOPMENT:
• LinkedIn Learning Certificates (relevant to ${targetRole})
• Coursera Professional Certificates
• Industry Association Memberships
• Continuing Education Units (CEUs)

🚀 EMERGING TECHNOLOGY CERTIFICATIONS:
• AI/Machine Learning Fundamentals
• Data Science Specialization
• Digital Marketing Certification
• Cybersecurity Awareness Training

📋 CERTIFICATION STRATEGY:
• Prioritize certifications mentioned in job descriptions
• Choose 3-5 high-impact certifications over many basic ones
• Include completion dates and certification numbers
• Add logos and badges to LinkedIn profile
• Maintain active certifications through renewal requirements

💡 QUICK WINS (Can complete in 1-4 weeks):
• Google Analytics Individual Qualification
• HubSpot Content Marketing Certification
• Microsoft Office Specialist
• LinkedIn Learning Path Completion

🎓 LONG-TERM INVESTMENTS (3-6 months):
• Professional certification in ${keywords[0]}
• Industry-specific advanced certifications
• Leadership and management programs
• Technical specialization courses`
}

function generateBanner(resumeText: string, targetRole: string, keywords: string[]): string {
  return `🎨 LINKEDIN BANNER DESIGN CONCEPTS:

🎯 CONCEPT 1: PROFESSIONAL MINIMALIST
• Clean background with subtle gradient (navy to light blue)
• Your name and "${targetRole}" in modern typography
• Key skills: ${keywords.slice(0, 3).join(" • ")}
• Professional headshot integration
• Contact information in corner

🚀 CONCEPT 2: INDUSTRY-FOCUSED
• Background featuring relevant industry imagery
• Infographic-style layout showcasing:
  - Years of experience
  - Key achievements (numbers/percentages)
  - Core competencies: ${keywords.slice(0, 4).join(", ")}
• Modern color scheme aligned with ${targetRole} field

💼 CONCEPT 3: ACHIEVEMENT SHOWCASE
• Split-screen design:
  - Left: Professional photo with name/title
  - Right: Key metrics and accomplishments
• Highlight: "${extractExperience(resumeText)}+ Years Experience"
• Featured skills: ${keywords.slice(0, 5).join(" | ")}
• Call-to-action: "Let's Connect"

🎨 DESIGN SPECIFICATIONS:
• Dimensions: 1584 x 396 pixels
• File format: PNG or JPG
• Text should be readable on mobile devices
• Use high-contrast colors for accessibility
• Include your professional brand colors

🔧 TOOLS FOR CREATION:
• Canva (templates available)
• Adobe Creative Suite
• Figma (free option)
• LinkedIn Banner Generator tools

💡 CONTENT ELEMENTS TO INCLUDE:
• Your name and current/target title
• 2-3 key skills or specializations
• Years of experience or key achievement
• Professional contact information
• Consistent branding with your profile

🌟 PRO TIPS:
• Update banner when changing roles or focus
• A/B test different designs to see engagement
• Ensure banner complements your profile photo
• Keep text minimal but impactful
• Use your banner to tell your professional story`
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText, targetRole } = await request.json()

    if (!resumeText || !targetRole) {
      return NextResponse.json({ error: "Resume text and target role are required" }, { status: 400 })
    }

    // Find relevant keywords for the target role
    const keywords = findRelevantKeywords(targetRole)

    // Generate all 8 LinkedIn sections
    const optimizedSections = {
      headline: generateHeadline(resumeText, targetRole, keywords),
      about: generateAbout(resumeText, targetRole, keywords),
      experience: generateExperience(resumeText, targetRole, keywords),
      projects: generateProjects(resumeText, targetRole, keywords),
      education: generateEducation(resumeText, targetRole, keywords),
      skills: generateSkills(resumeText, targetRole, keywords),
      certifications: generateCertifications(resumeText, targetRole, keywords),
      banner: generateBanner(resumeText, targetRole, keywords),
    }

    return NextResponse.json(optimizedSections)
  } catch (error) {
    console.error("Optimization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
