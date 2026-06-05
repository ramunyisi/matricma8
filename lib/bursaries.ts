import type { Bursary, BursaryMatch, LearnerProfile } from "@/lib/types";
import { calculateAverage } from "@/lib/aps";

export function matchBursaries(profile: LearnerProfile, bursaries: Bursary[], today = new Date()): BursaryMatch[] {
  const average = calculateAverage(profile.subjects);

  return bursaries
    .map((bursary) => {
      const reasons: string[] = [];
      const missing: string[] = [];
      let score = 0;

      const fieldMatch = profile.careerInterests.some((interest) =>
        bursary.fieldOfStudy.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(bursary.fieldOfStudy.toLowerCase())
      );
      if (fieldMatch) {
        score += 28;
        reasons.push(`Career interest aligns with ${bursary.fieldOfStudy}.`);
      } else {
        missing.push(`Field of study is ${bursary.fieldOfStudy}.`);
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

      const deadline = new Date(`${bursary.deadline}T23:59:59`);
      if (deadline >= today) {
        score += 10;
        reasons.push("Deadline appears open based on stored date.");
      } else {
        missing.push("Stored deadline has passed.");
      }

      if (bursary.grade12Only && profile.grade !== 12) {
        score = Math.max(0, score - 20);
        missing.push("This sample bursary is marked Grade 12 only.");
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
  const due = new Date(`${deadline}T23:59:59`);
  const diff = due.getTime() - today.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}
