export interface KeywordMapping {
  bucket: string
  jobTitle: string
  location: string
  experienceLevel: string
  remote: boolean
  keywords: string[]
}

export const keywordMappings: KeywordMapping[] = [
  // AML Domain
  {
    bucket: "AML",
    jobTitle: "Anti-Money Laundering (AML)",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
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
  },
  {
    bucket: "AML",
    jobTitle: "KYC",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },
  {
    bucket: "AML",
    jobTitle: "BSA",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },
  {
    bucket: "AML",
    jobTitle: "Transaction Monitoring",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },
  {
    bucket: "AML",
    jobTitle: "Compliance Analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },
  {
    bucket: "AML",
    jobTitle: "Fraud Analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },
  {
    bucket: "AML",
    jobTitle: "Financial Crime",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },
  {
    bucket: "AML",
    jobTitle: "Compliance",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "AML",
      "Anti-Money Laundering",
      "Anti Money Laundering",
      "KYC",
      "BSA",
      "SAR",
      "Fraud Analyst",
      "Financial Crime",
      "sanctions",
      "compliance",
      "risk analyst",
      "risk management specialist",
    ],
  },

  // Data Domain
  {
    bucket: "Data",
    jobTitle: "Data Analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Data Analyst", "Power BI", "Tableau", "Data Visualisation", "Data", "BI", "Business"],
  },
  {
    bucket: "Data",
    jobTitle: "Data Analyst",
    location: "United States (Florida if not remote)",
    experienceLevel: "All Levels",
    remote: false,
    keywords: ["Data Analyst", "Power BI", "Tableau", "Data Visualisation", "Data", "BI", "Business analyst"],
  },
  {
    bucket: "Data",
    jobTitle: "Data Engineer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Data Engineer", "Database Engineer", "SQL", "data analyst", "powerbi", "BI", "Business analyst"],
  },
  {
    bucket: "Data",
    jobTitle: "Data Science",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Data Science",
      "Data Scientist",
      "Machine Learning",
      "ML",
      "Artificial Intelligence",
      "AI",
      "Data",
      "data engineer",
      "data analyst",
    ],
  },
  {
    bucket: "Data",
    jobTitle: "Healthcare Data Scientist",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Data Science",
      "Data Scientist",
      "Machine Learning",
      "ML",
      "Artificial Intelligence",
      "AI",
      "Healthcare",
      "Medical Data",
    ],
  },

  // Finance Domain
  {
    bucket: "Finance",
    jobTitle: "Financial Analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Financial Analyst", "Finance", "Financial Modeling", "Budgeting", "Forecasting", "Investment Analysis"],
  },

  // Supply Chain Domain
  {
    bucket: "Supply Chain",
    jobTitle: "Supply Chain Analyst",
    location: "United States (Texas if not remote)",
    experienceLevel: "All Levels",
    remote: false,
    keywords: ["Supply Chain", "Logistics", "Procurement", "Inventory Management", "Operations", "Planning"],
  },
  {
    bucket: "Supply Chain",
    jobTitle: "Supply Chain Analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Supply Chain", "Logistics", "Procurement", "Inventory Management", "Operations", "Planning"],
  },

  // Computer Science Domain
  {
    bucket: "Computer Science",
    jobTitle: "Computer Science early grad",
    location: "United States",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: ["Computer Science", "Programming", "Software Development", "Coding", "Algorithms", "Data Structures"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Computer Science",
    location: "United States",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: ["Computer Science", "Programming", "Software Development", "Coding", "Algorithms", "Data Structures"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Java Developer",
    location: "United States",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: [
      "Java",
      "Programming",
      "Software Development",
      "Object-Oriented Programming",
      "Spring",
      "Backend Development",
    ],
  },
  {
    bucket: "Computer Science",
    jobTitle: ".Net Developer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [".NET", "C#", "ASP.NET", "Microsoft", "Software Development", "Backend Development"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Devops",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["DevOps", "CI/CD", "Docker", "Kubernetes", "AWS", "Azure", "Infrastructure", "Automation"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Computer Science Internships",
    location: "United States",
    experienceLevel: "Internships",
    remote: false,
    keywords: ["Computer Science", "Programming", "Software Development", "Internship", "Entry Level"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Embedded Software Engineer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Embedded Systems", "C/C++", "Microcontrollers", "Hardware", "Firmware", "Real-time Systems"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Network engineer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Network Engineering", "Cisco", "Routing", "Switching", "TCP/IP", "Network Security"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "System administrator",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "System Administration",
      "Linux",
      "Windows Server",
      "Network Management",
      "IT Support",
      "Infrastructure",
    ],
  },
  {
    bucket: "Computer Science",
    jobTitle: "sales force developer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Salesforce", "Developer", "admin", "CRM", "Apex", "Lightning"],
  },
  {
    bucket: "Computer Science",
    jobTitle: "Software Development",
    location: "United Kingdom",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: [
      "software",
      "developer",
      "frontend",
      "backend",
      "IT",
      "web",
      "AI",
      "ML",
      "machine",
      "engineer",
      "data",
      "fullstack",
      "front-end",
      "back-end",
      "developer",
      "Gen",
    ],
  },

  // Business Analyst Domain
  {
    bucket: "Business Analyst",
    jobTitle: "Business Analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Business Analyst",
      "Requirements Analysis",
      "Process Improvement",
      "Stakeholder Management",
      "Documentation",
    ],
  },

  // Mechanical Domain
  {
    bucket: "Mechanical",
    jobTitle: "Mechanical Engineer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Maintenance",
      "Manufacturing",
      "Quality",
      "Industrial",
      "Lean specialist",
      "Continuous improvement",
      "Mechanical",
      "Design",
    ],
  },

  // Project Management Domain
  {
    bucket: "Project Management",
    jobTitle: "Project Management",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Project", "Product", "Program", "business analyst"],
  },
  {
    bucket: "Project Management",
    jobTitle: "Project Management CIVIL",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Project",
      "Product",
      "Program",
      "Civil",
      "Construction",
      "Project engineer",
      "operational manager",
      "construction management roles",
    ],
  },
  {
    bucket: "Project Management",
    jobTitle: "Project Management MECHANICAL",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Project",
      "Product",
      "Program",
      "Manufacturing",
      "Design",
      "Maintenance",
      "Manufacturing",
      "Quality",
      "Industrial",
      "Lean specialist",
      "Continuous improvement",
    ],
  },
  {
    bucket: "Project Management",
    jobTitle: "Project Management Internships",
    location: "United States",
    experienceLevel: "Internships",
    remote: true,
    keywords: ["Project", "Product", "Program"],
  },

  // Healthcare Domain
  {
    bucket: "Healthcare",
    jobTitle: "Claims analyst",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Claims",
      "coding",
      "billing",
      "records",
      "specialist",
      "health informat",
      "coder",
      "EHR",
      "scribe",
      "Insurance",
      "Reimbursement",
    ],
  },
  {
    bucket: "Healthcare",
    jobTitle: "Medical coding",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "coding",
      "billing",
      "records",
      "specialist",
      "health informat",
      "coder",
      "EHR",
      "scribe",
      "Insurance",
      "Reimbursement",
    ],
  },
  {
    bucket: "Healthcare",
    jobTitle: "Bioinformatics",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Bioinformatics", "bioinformatician", "Computational Biology"],
  },

  // Environmental Domain
  {
    bucket: "Environmental",
    jobTitle: "Environmental Internships",
    location: "United States",
    experienceLevel: "Internships",
    remote: false,
    keywords: [
      "Environmental Analyst",
      "Environmental Data & GIS",
      "EHR",
      "Water Quality",
      "Water Resource Management",
      "Sustainability",
      "ESG",
      "Environmental Policy & Compliance",
      "Environmental Health & Safety (EHS)",
      "Climate Change & Adaptation",
    ],
  },

  // SAP Domain
  {
    bucket: "SAP",
    jobTitle: "SAP",
    location: "United States",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: [
      "SAP",
      "supply",
      "procurement",
      "material",
      "planner",
      "logistic",
      "inventory",
      "buyer",
      "seller",
      "analyst",
      "procurement",
    ],
  },

  // Payroll Domain
  {
    bucket: "Payroll Analyst",
    jobTitle: "Payroll Analyst",
    location: "United States",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: ["Workday", "Payroll", "financial analyst", "Benefit", "HR"],
  },

  // Workday Domain
  {
    bucket: "Workday analyst",
    jobTitle: "Workday analyst",
    location: "United States",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: ["Workday", "Payroll", "financial analyst", "Benefit", "HR"],
  },

  // Cyber Security Domain
  {
    bucket: "Cyber Security",
    jobTitle: "Cyber Security",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: ["Cyber", "Security", "SOC", "Cyber Threat"],
  },
  {
    bucket: "Cyber Security",
    jobTitle: "Cyber Security",
    location: "United Kingdom",
    experienceLevel: "Entry Level",
    remote: true,
    keywords: ["Cyber", "Security", "SOC", "Cyber Threat"],
  },

  // Electrical Engineer Domain
  {
    bucket: "Electrical engineer",
    jobTitle: "Electrical Project Engineer",
    location: "United States",
    experienceLevel: "All Levels",
    remote: true,
    keywords: [
      "Electrical Project Engineer",
      "Controls Engineer",
      "Automation Engineer",
      "Electrical",
      "electric",
      "project",
      "Product",
      "Program",
    ],
  },
]

export function getKeywordsByDomain(domain: string): string[] {
  const domainMappings = keywordMappings.filter((mapping) =>
    mapping.bucket.toLowerCase().includes(domain.toLowerCase()),
  )

  if (domainMappings.length === 0) {
    return []
  }

  // Combine all keywords from matching domains and remove duplicates
  const allKeywords = domainMappings.flatMap((mapping) => mapping.keywords)
  return [...new Set(allKeywords)]
}

export function getAllDomains(): string[] {
  const domains = keywordMappings.map((mapping) => mapping.bucket)
  return [...new Set(domains)]
}

export function searchKeywordMappings(searchTerm: string): KeywordMapping[] {
  const term = searchTerm.toLowerCase()
  return keywordMappings.filter(
    (mapping) =>
      mapping.bucket.toLowerCase().includes(term) ||
      mapping.jobTitle.toLowerCase().includes(term) ||
      mapping.keywords.some((keyword) => keyword.toLowerCase().includes(term)),
  )
}

export function findKeywordsByRole(targetRole: string): string[] {
  const term = targetRole.toLowerCase()

  // First, try to find exact job title matches
  const exactMatches = keywordMappings.filter((mapping) => mapping.jobTitle.toLowerCase() === term)

  if (exactMatches.length > 0) {
    // Return keywords from the first exact match
    return exactMatches[0].keywords
  }

  // If no exact match, try partial job title matches
  const partialMatches = keywordMappings.filter(
    (mapping) => mapping.jobTitle.toLowerCase().includes(term) || term.includes(mapping.jobTitle.toLowerCase()),
  )

  if (partialMatches.length > 0) {
    // Return keywords from the first partial match
    return partialMatches[0].keywords
  }

  // If no job title matches, try keyword matches
  const keywordMatches = keywordMappings.filter((mapping) =>
    mapping.keywords.some((keyword) => keyword.toLowerCase().includes(term) || term.includes(keyword.toLowerCase())),
  )

  if (keywordMatches.length > 0) {
    // Return keywords from the first keyword match
    return keywordMatches[0].keywords
  }

  // If no matches found, return empty array
  return []
}
