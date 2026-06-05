export type Role = "learner" | "parent" | "teacher_admin";

export type RiskLevel = "Safe" | "Watch" | "At Risk";

export type InternetAccessLevel = "low" | "medium" | "high";

export type LearnerSubject = {
  id: string;
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
  minAverage: number;
  minSubjectRequirementsJson: { subject: string; minMark: number }[];
  provinceRequirements: string[];
  citizenshipRequirements: string;
  deadline: string;
  applicationUrl: string;
  requiredDocumentsJson: string[];
  sourceUrl: string;
  lastVerifiedAt: string;
  sampleData?: boolean;
  grade12Only?: boolean;
  universityStudentsOnly?: boolean;
};

export type BursaryMatch = {
  bursary: Bursary;
  matchScore: number;
  matchReasons: string[];
  missingRequirements: string[];
};

export type PastPaperQuestion = {
  id: string;
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

export type StudyTask = {
  day: string;
  subject: string;
  topic: string;
  taskType: "concept" | "practice" | "revision" | "assessment";
  durationMinutes: number;
};
