import { describe, expect, it } from "vitest";
import { inferCoachSubjectName, normalizeSubjectText } from "@/lib/coach-subject";

describe("coach subject inference", () => {
  it("normalizes subject names for matching", () => {
    expect(normalizeSubjectText("isiZulu Home Language")).toBe("isizulu home language");
  });

  it("infers the subject from the learner message", () => {
    expect(
      inferCoachSubjectName([{ name: "Geography" }, { name: "Mathematics" }], "Test me on Geography maps", "Mathematics")
    ).toBe("Geography");
  });

  it("falls back when no subject is found", () => {
    expect(inferCoachSubjectName([{ name: "Geography" }], "help me", "General")).toBe("General");
  });
});
