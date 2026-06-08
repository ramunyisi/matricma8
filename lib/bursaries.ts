import type { Bursary, BursaryMatch, LearnerProfile } from "@/lib/types";
import { calculateAverage } from "@/lib/aps";

export function matchBursaries(profile: LearnerProfile, bursaries: Bursary[], today = new Date()): BursaryMatch[] {
  const average = calculateAverage(profile.subjects);

  return bursaries
    .map((bursary) => {
      const reasons: string[] = [];
      const missing: string[] = [];
      let score = 0;

      const lowerField = bursary.fieldOfStudy.toLowerCase();
      const isGeneralFunding = lowerField.includes("all fields") || lowerField.includes("multiple fields") || lowerField.includes("financial aid");
      const fieldMatch = isGeneralFunding || profile.careerInterests.some((interest) =>
        lowerField.includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(lowerField)
      );
      if (fieldMatch) {
        score += 28;
        reasons.push(isGeneralFunding ? "This funding can support more than one field." : `Career interest aligns with ${bursary.fieldOfStudy}.`);
      } else {
        missing.push(`Field of study is ${bursary.fieldOfStudy}.`);
      }

      if (bursary.studyLevels && bursary.studyLevels.length > 0) {
        const lowerLevels = bursary.studyLevels.map((level) => level.toLowerCase());
        if (profile.grade === 12 && lowerLevels.some((level) => level.includes("undergraduate") || level.includes("grade 12") || level.includes("school") || level.includes("tvet"))) {
          score += 8;
          reasons.push(`This bursary accepts learners at the pre-university stage.`);
        } else if (profile.grade === 12 && lowerLevels.some((level) => level.includes("postgraduate") || level.includes("honours"))) {
          missing.push("This bursary is aimed at postgraduate study or higher years.");
        } else {
          reasons.push(`Study level note: ${bursary.studyLevels.join(", ")}.`);
        }
      }

      if (bursary.fundingType) {
        reasons.push(`Funding type: ${bursary.fundingType}.`);
      }

      if (average >= bursary.minAverage) {
        score += 22;
        reasons.push(`Average ${average}% meets sample minimum ${bursary.minAverage}%.`);
      } else {
        missing.push(`Average needs ${bursary.minAverage}% or higher in this sample record.`);
      }

      const subjectMatches = bursary.minSubjectRequirementsJson.filter((requirement) => {
        const subject = profile.subjects.find((item) => item.name === requirement.subject);
        return subject && subject.currentMark >= requirement.minMark;
      });
      if (subjectMatches.length === bursary.minSubjectRequirementsJson.length) {
        score += 22;
        reasons.push("Subject minimums are currently met.");
      } else {
        const missingSubjects = bursary.minSubjectRequirementsJson
          .filter((requirement) => !subjectMatches.includes(requirement))
          .map((requirement) => `${requirement.subject} ${requirement.minMark}%`);
        if (missingSubjects.length > 0) missing.push(`Subject requirement to verify: ${missingSubjects.join(", ")}.`);
      }

      if (bursary.provinceRequirements.includes("All provinces") || bursary.provinceRequirements.includes(profile.province)) {
        score += 18;
        reasons.push(`Province eligibility includes ${profile.province}.`);
      } else {
        missing.push(`Province eligibility listed as ${bursary.provinceRequirements.join(", ")}.`);
      }

      const status = bursaryLiveStatus(bursary, today);
      if (status === "open") {
        score += 10;
        reasons.push("Deadline appears open based on stored date.");
      } else if (status === "closing") {
        score += 6;
        reasons.push("This bursary appears to be closing soon.");
      } else if (status === "closed") {
        score = Math.max(0, score - 10);
        missing.push("Stored deadline has passed.");
      } else {
        reasons.push("Check the official page for the current closing date.");
      }

      if (bursary.grade12Only && profile.grade !== 12) {
        score = Math.max(0, score - 20);
        missing.push("This sample bursary is marked Grade 12 only.");
      }

      if (bursary.universityStudentsOnly && profile.grade === 12) {
        score = Math.max(0, score - 10);
        missing.push("This bursary is for current university students.");
      }

      return {
        bursary,
        matchScore: Math.min(100, score),
        matchReasons: reasons,
        missingRequirements: missing
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function isClosingSoon(deadline: string, today = new Date(), days = 45): boolean {
  if (!deadline) return false;
  const due = new Date(`${deadline}T23:59:59`);
  const diff = due.getTime() - today.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function bursaryDeadlineStatus(deadline: string, today = new Date()) {
  if (!deadline) return "unknown" as const;
  const due = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(due.getTime())) return "unknown" as const;
  return due >= today ? "open" : "closed";
}

export function bursaryLiveStatus(bursary: Bursary, today = new Date()) {
  if (bursary.deadline) {
    const deadlineStatus = bursaryDeadlineStatus(bursary.deadline, today);
    if (deadlineStatus === "closed") return "closed";
    if (isClosingSoon(bursary.deadline, today)) {
      if (bursary.officialStatus === "closed") return "closed";
      return "closing";
    }
  }
  if (bursary.officialStatus && bursary.officialStatus !== "unknown") return bursary.officialStatus;
  return "unknown" as const;
}
