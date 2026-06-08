import { calculateAps, evaluateApsRule, estimateFinalMark } from "@/lib/aps";
import type { ApsPrediction, ApsRule, LearnerSubject } from "@/lib/types";

export type ProgrammeMatch = {
  rule: ApsRule;
  prediction: ApsPrediction;
  apsGap: number;
  missingSubjects: string[];
  belowMinimumSubjects: string[];
};

export function matchProgrammes(subjects: LearnerSubject[], rules: ApsRule[]): ProgrammeMatch[] {
  return rules
    .map((rule) => {
      const prediction = evaluateApsRule(subjects, rule);
      const calculatedAps = calculateAps(subjects, rule);
      const minimumTotal = rule.ruleJson.minimumTotal ?? 0;
      const missingSubjects: string[] = [];
      const belowMinimumSubjects: string[] = [];

      for (const requirement of rule.minimumSubjectRequirementsJson) {
        const subject = subjects.find((item) => normaliseSubject(item.name) === normaliseSubject(requirement.subject));
        if (!subject) {
          missingSubjects.push(requirement.subject);
        } else if (estimateFinalMark(subject.currentMark, subject.targetMark) < requirement.minMark) {
          belowMinimumSubjects.push(requirement.subject);
        }
      }

      return {
        rule,
        prediction,
        apsGap: minimumTotal ? calculatedAps - minimumTotal : 0,
        missingSubjects,
        belowMinimumSubjects
      };
    })
    .sort((a, b) => statusRank(a.prediction.eligibilityStatus) - statusRank(b.prediction.eligibilityStatus) || b.apsGap - a.apsGap);
}

function normaliseSubject(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function statusRank(status: ApsPrediction["eligibilityStatus"]) {
  if (status === "Likely qualifies") return 0;
  if (status === "Watch requirements") return 1;
  return 2;
}
