import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "@/lib/rate-limit";

describe("rate limit helper", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests until the limit is reached", () => {
    expect(checkRateLimit("learner-1", 2, 1000, 100).allowed).toBe(true);
    expect(checkRateLimit("learner-1", 2, 1000, 200).allowed).toBe(true);
    expect(checkRateLimit("learner-1", 2, 1000, 300).allowed).toBe(false);
  });

  it("resets the bucket after the window expires", () => {
    expect(checkRateLimit("learner-1", 1, 1000, 100).allowed).toBe(true);
    expect(checkRateLimit("learner-1", 1, 1000, 200).allowed).toBe(false);
    expect(checkRateLimit("learner-1", 1, 1000, 1200).allowed).toBe(true);
  });
});
