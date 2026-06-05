import type { ApsPrediction, ApsRule, LearnerSubject, RiskLevel } from "@/lib/types";

export function nscLevel(mark: number): number {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}

export function calculateAverage(subjects: Pick<LearnerSubject, "currentMark">[]): number {
  if (subjects.length === 0) return 0;
  return Math.round(subjects.reduce((sum, subject) => sum + subject.currentMark, 0) / subjects.length);
}

export function estimateFinalMark(currentMark: number, targetMark: number): number {
  const realisticImprovement = currentMark < 50 ? 8 : currentMark < 65 ? 6 : 4;
  return Math.min(100, Math.round((currentMark * 0.72) + (Math.min(targetMark, currentMark + realisticImprovement) * 0.28)));
}

export function calculateAps(subjects: LearnerSubject[], rule?: ApsRule): number {
  const included = subjects.filter((subject) => {
    if (!rule?.ruleJson.includeLifeOrientation && subject.name.toLowerCase() === "life orientation") {
      return false;
    }
    return true;
  });

  return included.reduce((sum, subject) => {
    const mark = estimateFinalMark(subject.currentMark, subject.targetMark);
    if (rule?.ruleJson.method === "custom_bands" && rule.ruleJson.bands) {
      const band = [...rule.ruleJson.bands].sort((a, b) => b.min - a.min).find((item) => mark >= item.min);
      return sum + (band?.points ?? 0);
    }
    return sum + nscLevel(mark);
  }, 0);
}

export function subjectRisk(currentMark: number, targetMark: number): RiskLevel {
  const gap = targetMark - currentMark;
  if (currentMark < 40 || gap >= 18) return "At Risk";
  if (currentMark < 55 || gap >= 10) return "Watch";
  return "Safe";
}

export function predictRisk(currentMarks: Record<string, number>, targetMarks: Record<string, number>) {
  return Object.entries(currentMarks).map(([subject, mark]) => ({
    subject,
    currentMark: mark,
    targetMark: targetMarks[subject] ?? mark,
    risk: subjectRisk(mark, targetMarks[subject] ?? mark)
  }));
}

export function simulateWhatIf(subjects: LearnerSubject[], subjectName: string, newMark: number, rule?: ApsRule) {
  const updated = subjects.map((subject) =>
    subject.name === subjectName ? { ...subject, currentMark: newMark } : subject
  );

  return {
    before: calculateAps(subjects, rule),
    after: calculateAps(updated, rule),
    updatedSubjects: updated
  };
}

export function evaluateApsRule(subjects: LearnerSubject[], rule: ApsRule): ApsPrediction {
  const calculatedScore = calculateAps(subjects, rule);
  const explanation: string[] = [];
  const missing = rule.minimumSubjectRequirementsJson.filter((requirement) => {
    const subject = subjects.find((item) => item.name === requirement.subject);
    return !subject || estimateFinalMark(subject.currentMark, subject.targetMark) < requirement.minMark;
  });

  if (rule.ruleJson.minimumTotal) {
    explanation.push(`Estimated APS ${calculatedScore} against sample minimum ${rule.ruleJson.minimumTotal}.`);
  }

  for (const requirement of rule.minimumSubjectRequirementsJson) {
    explanation.push(`${requirement.subject}: minimum ${requirement.minMark}% required in this sample rule.`);
  }

  if (missing.length > 0) {
    return {
      calculatedScore,
      eligibilityStatus: "Does not qualify",
      explanation: [
        ...explanation,
        `Missing or below requirement: ${missing.map((item) => item.subject).join(", ")}. Verify with the institution.`
      ]
    };
  }

  if (rule.ruleJson.minimumTotal && calculatedScore < rule.ruleJson.minimumTotal) {
    return {
      calculatedScore,
      eligibilityStatus: "Watch requirements",
      explanation: [...explanation, "APS is below the sample total threshold. This is a prediction, not an official decision."]
    };
  }

  return {
    calculatedScore,
    eligibilityStatus: "Likely qualifies",
    explanation: [...explanation, "This only reflects stored sample rules. Confirm against official admission pages."]
  };
}
