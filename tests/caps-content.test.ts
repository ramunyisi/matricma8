import { describe, expect, it } from "vitest";
import { capsContentLibrary, getCapsContentForCoach, getCapsSectionsForCoach, summarizeCapsContentForPrompt } from "@/lib/caps-content";
import { chunkCapsText } from "@/lib/caps-extractor";
import { lifeSciencesCapsSections } from "@/lib/caps-life-sciences";

describe("CAPS content library", () => {
  it("contains official DBE source groups", () => {
    expect(capsContentLibrary.some((item) => item.category === "CAPS policy")).toBe(true);
    expect(capsContentLibrary.some((item) => item.title.includes("Mind the Gap"))).toBe(true);
  });

  it("filters content by subject", () => {
    const maths = getCapsContentForCoach("Mathematics", 12);
    expect(maths.some((item) => item.subject === "Mathematics")).toBe(true);
  });

  it("summarizes content for the coach", () => {
    const caps = summarizeCapsContentForPrompt("Geography", 12);
    expect(caps.length).toBeGreaterThan(0);
    expect(caps[0]?.subject).toBeDefined();
  });

  it("returns section chunks for the coach", () => {
    const sections = getCapsSectionsForCoach("Mathematics", 12, "functions");
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.sectionTitle).toBeDefined();
  });

  it("expands Life Sciences with a large chunk set", () => {
    expect(lifeSciencesCapsSections.length).toBeGreaterThanOrEqual(100);
    expect(lifeSciencesCapsSections.every((section) => section.subject === "Life Sciences")).toBe(true);
  });

  it("chunks extracted CAPS text into sections", () => {
    const sections = chunkCapsText(
      "DNA AND GENETICS\nDNA stores genetic information and meiosis creates variation.\n\nHuman reproduction depends on hormones and gamete formation.\fEcology and conservation\nPopulation changes influence ecosystems and biodiversity.",
      {
        subject: "Life Sciences",
        grade: 12,
        term: 1,
        sourceTitle: "Grade 12 Life Sciences Mind the Gap",
        sourceUrl: "https://example.org/caps.pdf",
        topicHint: "DNA and genetics",
        sourceType: "mind-the-gap"
      }
    );

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.subject).toBe("Life Sciences");
    expect(sections[0]?.sectionTitle).toContain("DNA");
    expect(sections[0]?.sectionSummary.length).toBeGreaterThan(0);
    expect(sections.some((section) => section.pageStart === 2)).toBe(true);
  });
});
