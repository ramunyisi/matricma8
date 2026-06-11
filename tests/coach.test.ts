import { describe, expect, it } from "vitest";
import { buildCoachInstructions, shouldAskForClarification } from "@/lib/ai";

describe("coach helper logic", () => {
  it("asks for clarification on vague prompts", () => {
    expect(shouldAskForClarification("help")).toBe(true);
    expect(shouldAskForClarification("Explain")).toBe(true);
  });

  it("accepts more specific prompts", () => {
    expect(shouldAskForClarification("Explain quadratic equations in Mathematics", "Mathematics")).toBe(false);
  });

  it("includes the selected mode in instructions", () => {
    const instructions = buildCoachInstructions("practice", "Mathematics");
    expect(instructions).toContain("Current coaching mode: practice.");
    expect(instructions).toContain("The learner's current subject is Mathematics.");
    expect(instructions).toContain("Do not treat Mathematics as the default subject.");
    expect(instructions).toContain("practice question");
  });
});
