import { describe, expect, it } from "vitest";
import {
  buildBursaryReminderMessage,
  buildStudyReminderMessage,
  isWithinReminderQuietHours,
  normalizeWhatsappPhone,
  reminderKeyForBursary,
  reminderKeyForStudy
} from "@/lib/whatsapp-reminders";
import { demoProfile, sampleBursaries } from "@/lib/sample-data";

describe("whatsapp reminders", () => {
  it("normalizes South African numbers", () => {
    expect(normalizeWhatsappPhone("082 123 4567")).toBe("+27821234567");
    expect(normalizeWhatsappPhone("+27 82 123 4567")).toBe("+27821234567");
  });

  it("builds a study reminder message", () => {
    const message = buildStudyReminderMessage(demoProfile, [
      { day: "Mon", subject: "Mathematics", topic: "Functions", taskType: "practice", durationMinutes: 50 },
      { day: "Tue", subject: "Physical Sciences", topic: "Momentum", taskType: "revision", durationMinutes: 35 }
    ]);

    expect(message).toContain("MatricSA study reminder");
    expect(message).toContain("Mathematics");
    expect(message).toContain("Priority subject gaps");
  });

  it("builds a bursary reminder message", () => {
    const bursary = sampleBursaries[0];
    const message = buildBursaryReminderMessage(bursary, 14, bursary.deadline);

    expect(message).toContain(bursary.name);
    expect(message).toContain(bursary.applicationUrl);
    expect(message).toContain("Reminder window");
  });

  it("handles overnight and same-hour quiet windows", () => {
    expect(isWithinReminderQuietHours(20, 6, 22)).toBe(true);
    expect(isWithinReminderQuietHours(20, 6, 5)).toBe(true);
    expect(isWithinReminderQuietHours(20, 6, 12)).toBe(false);
    expect(isWithinReminderQuietHours(8, 17, 12)).toBe(true);
    expect(isWithinReminderQuietHours(8, 8, 8)).toBe(false);
  });

  it("creates stable reminder keys for idempotent dispatch", () => {
    expect(reminderKeyForStudy("2026-06-16")).toBe("study-2026-06-16");
    expect(reminderKeyForBursary("bursary-1", "2026-07-31", 14)).toBe("bursary-bursary-1-2026-07-31-14");
  });
});
