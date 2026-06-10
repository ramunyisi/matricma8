import { describe, expect, it } from "vitest";
import { deriveCoachTopicKey, sortCoachMemory } from "@/lib/coach-memory";

describe("coach memory", () => {
  it("creates stable topic keys", () => {
    expect(deriveCoachTopicKey("Mathematics", "Quadratic equations")).toBe("mathematics-quadratic-equations");
  });

  it("sorts weak areas first", () => {
    const sorted = sortCoachMemory([
      {
        id: "1",
        learnerId: "learner",
        subjectName: "Maths",
        topicKey: "maths-a",
        topicLabel: "A",
        sessionCount: 2,
        questionCount: 1,
        struggleCount: 1,
        successCount: 3,
        lastMode: "practice",
        lastSeenAt: "2026-06-10T10:00:00Z",
        updatedAt: "2026-06-10T10:00:00Z"
      },
      {
        id: "2",
        learnerId: "learner",
        subjectName: "Maths",
        topicKey: "maths-b",
        topicLabel: "B",
        sessionCount: 4,
        questionCount: 2,
        struggleCount: 4,
        successCount: 0,
        lastMode: "markAnswer",
        lastSeenAt: "2026-06-10T11:00:00Z",
        updatedAt: "2026-06-10T11:00:00Z"
      }
    ]);

    expect(sorted[0].topicKey).toBe("maths-b");
  });
});
