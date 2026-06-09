export type Role = "learner" | "parent" | "teacher_admin";

export type RiskLevel = "Safe" | "Watch" | "At Risk";

export type InternetAccessLevel = "low" | "medium" | "high";

export type LearnerSubject = {
  id: string;
  subjectId?: string;
  name: string;
  grade: 10 | 11 | 12;
  currentMark: number;
  targetMark: number;
};

export type LearnerProfile = {
  id: string;
  grade: 10 | 11 | 12;
  province: string;
  schoolName?: string;
  homeLanguage: string;
  internetAccessLevel: InternetAccessLevel;
  careerInterests: string[];
  preferredStudyTimes: string[];
  examDate: string;
  whatsappPhone?: string;
  whatsappOptIn?: boolean;
  whatsappStudyReminders?: boolean;
  whatsappDeadlineReminders?: boolean;
  subjects: LearnerSubject[];
};

export type ApsRule = {
  id: string;
  institutionName: string;
  programmeName: string;
  ruleJson: {
    method: "nsc_levels" | "custom_bands";
    includeLifeOrientation?: boolean;
    bands?: { min: number; points: number }[];
    minimumTotal?: number;
  };
  minimumSubjectRequirementsJson: {
    subject: string;
    minMark: number;
  }[];
  sourceUrl: string;
  lastVerifiedAt: string;
  prospectusUrl?: string;
  prospectusNotes?: string[];
  sampleData?: boolean;
};

export type ApsPrediction = {
  calculatedScore: number;
  eligibilityStatus: "Likely qualifies" | "Watch requirements" | "Does not qualify";
  explanation: string[];
};

export type Bursary = {
  id: string;
  name: string;
  provider: string;
  fieldOfStudy: string;
  fundingType?: string;
  studyLevels?: string[];
  eligibilityCriteriaJson?: string[];
  minAverage: number;
  minSubjectRequirementsJson: { subject: string; minMark: number }[];
  provinceRequirements: string[];
  citizenshipRequirements: string;
  deadline: string;
  officialStatus?: "open" | "closing" | "closed" | "unknown";
  applicationUrl: string;
  requiredDocumentsJson: string[];
  sourceUrl: string;
  lastVerifiedAt: string;
  lastCheckedAt?: string;
  sampleData?: boolean;
  grade12Only?: boolean;
  universityStudentsOnly?: boolean;
  applicationWindow?: string;
  summary?: string;
  notes?: string;
};

export type BursaryMatch = {
  bursary: Bursary;
  matchScore: number;
  matchReasons: string[];
  missingRequirements: string[];
};

export type PastPaperQuestion = {
  id: string;
  questionNumber?: string;
  questionText?: string;
  grade: 10 | 11 | 12;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  year: number;
  examSession: string;
  paperNumber: string;
  marks: number;
  pageNumber: number;
  memoPageNumber: number;
  paperUrl: string;
  memoUrl: string;
  sourceName: string;
  sourceUrl: string;
};

export type PastPaper = {
  id: string;
  grade: 10 | 11 | 12;
  subject: string;
  year: number;
  examSession: string;
  paperNumber: string;
  paperUrl: string;
  memoUrl?: string;
  paperFilename: string;
  memoFilename?: string;
  language?: string;
  collectionTitle?: string;
  sourceName: string;
  sourceUrl: string;
  sampleData?: boolean;
};

export type StudyTask = {
  id?: string;
  day: string;
  subject: string;
  topic: string;
  taskType: "concept" | "practice" | "revision" | "assessment";
  durationMinutes: number;
  dueDate?: string;
  completed?: boolean;
};
