import { describe, expect, it } from "vitest";
import { calculateAps, evaluateApsRule, findMatchingSubject, nscLevel, simulateWhatIf, subjectRisk } from "@/lib/aps";
import { matchProgrammes } from "@/lib/programme-matches";
import { programmeRules } from "@/lib/programme-rules";
import { demoProfile, sampleApsRules } from "@/lib/sample-data";

describe("APS calculation", () => {
  it("maps marks to NSC APS levels", () => {
    expect(nscLevel(82)).toBe(7);
    expect(nscLevel(71)).toBe(6);
    expect(nscLevel(62)).toBe(5);
    expect(nscLevel(51)).toBe(4);
    expect(nscLevel(42)).toBe(3);
    expect(nscLevel(31)).toBe(2);
    expect(nscLevel(20)).toBe(1);
  });

  it("calculates configurable APS and what-if deltas", () => {
    const rule = sampleApsRules[0];
    const before = calculateAps(demoProfile.subjects, rule);
    const result = simulateWhatIf(demoProfile.subjects, "Mathematics", 75, rule);
    expect(result.before).toBe(before);
    expect(result.after).toBeGreaterThanOrEqual(result.before);
  });

  it("evaluates subject requirements separately from total APS", () => {
    const prediction = evaluateApsRule(demoProfile.subjects, sampleApsRules[0]);
    expect(prediction.calculatedScore).toBeGreaterThan(0);
    expect(prediction.explanation.join(" ")).toContain("Verify");
  });

  it("flags risk levels from mark gaps", () => {
    expect(subjectRisk(72, 78)).toBe("Safe");
    expect(subjectRisk(52, 64)).toBe("Watch");
    expect(subjectRisk(38, 55)).toBe("At Risk");
  });

  it("matches language subject aliases for prospectus rules", () => {
    const subject = findMatchingSubject(
      [{ id: "zul", name: "isiZulu Home Language", grade: 12, currentMark: 68, targetMark: 72 }],
      "Home Language"
    );
    expect(subject?.name).toBe("isiZulu Home Language");
  });

  it("ranks university programme matches by qualification status", () => {
    const matches = matchProgrammes(demoProfile.subjects, programmeRules);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].prediction.eligibilityStatus).toBe("Likely qualifies");
    expect(matches.some((match) => match.rule.institutionName.includes("University"))).toBe(true);
  });
});
