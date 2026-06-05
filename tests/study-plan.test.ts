import { describe, expect, it } from "vitest";
import { demoProfile } from "@/lib/sample-data";
import { generateLocalStudyPlan } from "@/lib/study-plan";

describe("study-plan generation", () => {
  it("creates a 7-day plan", () => {
    const plan = generateLocalStudyPlan(demoProfile);
    expect(plan).toHaveLength(7);
    expect(plan[0].subject).toBe("Mathematics");
    expect(plan.every((task) => task.durationMinutes > 0)).toBe(true);
  });

  it("uses shorter tasks for low internet access learners", () => {
    const plan = generateLocalStudyPlan({ ...demoProfile, internetAccessLevel: "low" });
    expect(plan[0].durationMinutes).toBe(35);
  });
});
