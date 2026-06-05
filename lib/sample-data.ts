import type { ApsRule, Bursary, LearnerProfile, PastPaperQuestion } from "@/lib/types";

export const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
];

export const sampleSubjects = [
  "Mathematics",
  "Mathematical Literacy",
  "Physical Sciences",
  "Life Sciences",
  "English Home Language",
  "English First Additional Language",
  "Accounting",
  "Business Studies",
  "Geography",
  "History",
  "Economics",
  "Computer Applications Technology",
  "Information Technology"
];

export const demoProfile: LearnerProfile = {
  id: "demo-learner",
  grade: 12,
  province: "Gauteng",
  schoolName: "Sample Secondary School",
  homeLanguage: "English",
  internetAccessLevel: "medium",
  careerInterests: ["Engineering", "Data science", "Commerce"],
  preferredStudyTimes: ["Weekday evenings", "Saturday morning"],
  examDate: "2026-10-19",
  subjects: [
    { id: "maths", name: "Mathematics", grade: 12, currentMark: 48, targetMark: 65 },
    { id: "phys", name: "Physical Sciences", grade: 12, currentMark: 52, targetMark: 68 },
    { id: "eng", name: "English Home Language", grade: 12, currentMark: 63, targetMark: 72 },
    { id: "life", name: "Life Sciences", grade: 12, currentMark: 59, targetMark: 70 },
    { id: "acc", name: "Accounting", grade: 12, currentMark: 71, targetMark: 78 },
    { id: "geo", name: "Geography", grade: 12, currentMark: 57, targetMark: 66 }
  ]
};

export const sampleApsRules: ApsRule[] = [
  {
    id: "sample-uct-bsc",
    institutionName: "Sample University",
    programmeName: "BSc Engineering Foundation Track",
    ruleJson: { method: "nsc_levels", includeLifeOrientation: false, minimumTotal: 34 },
    minimumSubjectRequirementsJson: [
      { subject: "Mathematics", minMark: 60 },
      { subject: "Physical Sciences", minMark: 60 },
      { subject: "English Home Language", minMark: 50 }
    ],
    sourceUrl: "https://example.edu/admissions/sample-engineering",
    lastVerifiedAt: "2026-01-15",
    sampleData: true
  },
  {
    id: "sample-commerce",
    institutionName: "Sample Metro University",
    programmeName: "BCom Accounting",
    ruleJson: { method: "nsc_levels", includeLifeOrientation: false, minimumTotal: 30 },
    minimumSubjectRequirementsJson: [
      { subject: "Mathematics", minMark: 50 },
      { subject: "English Home Language", minMark: 50 },
      { subject: "Accounting", minMark: 60 }
    ],
    sourceUrl: "https://example.edu/admissions/sample-commerce",
    lastVerifiedAt: "2026-01-15",
    sampleData: true
  }
];

export const sampleBursaries: Bursary[] = [
  {
    id: "sample-stem-fund",
    name: "Sample STEM Future Bursary",
    provider: "MatricMate Demo Foundation",
    fieldOfStudy: "Engineering",
    minAverage: 65,
    minSubjectRequirementsJson: [
      { subject: "Mathematics", minMark: 60 },
      { subject: "Physical Sciences", minMark: 60 }
    ],
    provinceRequirements: ["Gauteng", "Limpopo", "Mpumalanga"],
    citizenshipRequirements: "South African citizen or permanent resident",
    deadline: "2026-09-30",
    applicationUrl: "https://example.org/sample-stem-bursary",
    requiredDocumentsJson: ["ID document", "Latest school report", "Proof of residence"],
    sourceUrl: "https://example.org/sample-stem-bursary",
    lastVerifiedAt: "2026-01-15",
    sampleData: true,
    grade12Only: true
  },
  {
    id: "sample-commerce-fund",
    name: "Sample Commerce Access Award",
    provider: "MatricMate Demo Trust",
    fieldOfStudy: "Commerce",
    minAverage: 60,
    minSubjectRequirementsJson: [{ subject: "Accounting", minMark: 60 }],
    provinceRequirements: ["All provinces"],
    citizenshipRequirements: "South African citizen",
    deadline: "2026-08-15",
    applicationUrl: "https://example.org/sample-commerce-award",
    requiredDocumentsJson: ["ID document", "Grade 11 final report", "Motivation letter"],
    sourceUrl: "https://example.org/sample-commerce-award",
    lastVerifiedAt: "2026-01-15",
    sampleData: true
  },
  {
    id: "sample-it-fund",
    name: "Sample Digital Skills Bursary",
    provider: "MatricMate Demo Tech Council",
    fieldOfStudy: "Information Technology",
    minAverage: 58,
    minSubjectRequirementsJson: [
      { subject: "Mathematics", minMark: 50 },
      { subject: "Information Technology", minMark: 55 }
    ],
    provinceRequirements: ["Western Cape", "Gauteng", "KwaZulu-Natal"],
    citizenshipRequirements: "South African citizen or refugee permit holder",
    deadline: "2026-10-10",
    applicationUrl: "https://example.org/sample-digital-skills",
    requiredDocumentsJson: ["ID document", "School report", "Parent/guardian consent if under 18"],
    sourceUrl: "https://example.org/sample-digital-skills",
    lastVerifiedAt: "2026-01-15",
    sampleData: true
  }
];

export const sampleQuestions: PastPaperQuestion[] = [
  {
    id: "maths-2024-p1-fn",
    questionNumber: "Metadata record",
    grade: 12,
    subject: "Mathematics",
    topic: "Functions and graphs",
    difficulty: "medium",
    year: 2024,
    examSession: "November",
    paperNumber: "Paper 1",
    marks: 12,
    pageNumber: 5,
    memoPageNumber: 4,
    paperUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593",
    memoUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593",
    sourceName: "Department of Basic Education NSC Past Examination Papers",
    sourceUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593"
  },
  {
    id: "phys-2024-p1-mech",
    questionNumber: "Metadata record",
    grade: 12,
    subject: "Physical Sciences",
    topic: "Newton's laws and momentum",
    difficulty: "hard",
    year: 2024,
    examSession: "November",
    paperNumber: "Paper 1",
    marks: 15,
    pageNumber: 7,
    memoPageNumber: 6,
    paperUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593",
    memoUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593",
    sourceName: "Department of Basic Education NSC Past Examination Papers",
    sourceUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593"
  },
  {
    id: "life-2023-p2-gen",
    questionNumber: "Metadata record",
    grade: 12,
    subject: "Life Sciences",
    topic: "Genetics and inheritance",
    difficulty: "medium",
    year: 2023,
    examSession: "November",
    paperNumber: "Paper 2",
    marks: 10,
    pageNumber: 8,
    memoPageNumber: 7,
    paperUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593",
    memoUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593",
    sourceName: "Department of Basic Education NSC Past Examination Papers",
    sourceUrl: "https://www.education.gov.za/?link=599&mid=1741&tabid=593"
  }
];
