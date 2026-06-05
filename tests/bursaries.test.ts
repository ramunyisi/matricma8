import { describe, expect, it } from "vitest";
import { matchBursaries } from "@/lib/bursaries";
import { demoProfile, sampleBursaries } from "@/lib/sample-data";

describe("bursary matching", () => {
  it("sorts matches by score and includes reasons", () => {
    const matches = matchBursaries(demoProfile, sampleBursaries, new Date("2026-06-05"));
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[matches.length - 1].matchScore);
    expect(matches[0].matchReasons.length + matches[0].missingRequirements.length).toBeGreaterThan(0);
  });

  it("penalizes closed deadlines", () => {
    const matches = matchBursaries(demoProfile, sampleBursaries, new Date("2027-01-01"));
    expect(matches.some((match) => match.missingRequirements.includes("Stored deadline has passed."))).toBe(true);
  });
});
