import { describe, expect, it } from "vitest";
import { bursaryLiveStatus, matchBursaries } from "@/lib/bursaries";
import { verifiedBursaries } from "@/lib/bursary-directory";
import { demoProfile, sampleBursaries } from "@/lib/sample-data";
import { formatDate } from "@/lib/utils";

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

  it("keeps general funding entries visible even without a deadline", () => {
    const matches = matchBursaries(demoProfile, verifiedBursaries, new Date("2026-06-08"));
    const nsfas = matches.find((match) => match.bursary.provider === "National Student Financial Aid Scheme");
    expect(nsfas).toBeTruthy();
    expect(nsfas?.matchReasons.join(" ")).toContain("Check the official page");
  });

  it("uses the official status when present", () => {
    const standardBank = verifiedBursaries.find((bursary) => bursary.id === "standard-bank-bursary");
    expect(standardBank).toBeTruthy();
    expect(bursaryLiveStatus(standardBank!, new Date("2026-06-08"))).toBe("closed");
  });

  it("handles blank dates in the shared formatter", () => {
    expect(formatDate("")).toBe("Not listed");
    expect(formatDate("not-a-date")).toBe("Not listed");
  });
});
