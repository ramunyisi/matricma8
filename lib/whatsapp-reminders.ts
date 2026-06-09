import type { Bursary, LearnerProfile, StudyTask } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export type BursaryReminderSource = Pick<Bursary, "name" | "provider" | "applicationUrl" | "notes">;

export function buildStudyReminderMessage(profile: LearnerProfile, tasks: StudyTask[], today = new Date()) {
  const summary = tasks.slice(0, 3).map((task) => `- ${task.subject}: ${task.topic} (${task.durationMinutes} min)`).join("\n");
  const gapSummary = profile.subjects
    .slice()
    .sort((a, b) => (b.targetMark - b.currentMark) - (a.targetMark - a.currentMark))
    .slice(0, 2)
    .map((subject) => `- ${subject.name}: target ${subject.targetMark}%, now ${subject.currentMark}%`)
    .join("\n");

  return [
    `MatricSA study reminder for ${new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(today)}:`,
    "",
    summary || "- No study tasks are queued yet.",
    "",
    "Priority subject gaps:",
    gapSummary || "- Keep revising your current subjects.",
    "",
    "Keep the work simple: review one concept, do one practice set, and check your memo or notes after each attempt."
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildBursaryReminderMessage(bursary: BursaryReminderSource, daysBeforeDeadline: number, deadline: string) {
  return [
    `MatricSA bursary reminder: ${bursary.name}`,
    bursary.provider,
    `Deadline: ${formatDate(deadline)}`,
    `Reminder window: ${daysBeforeDeadline} day${daysBeforeDeadline === 1 ? "" : "s"} before the deadline.`,
    bursary.applicationUrl,
    bursary.notes ? `Note: ${bursary.notes}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function normalizeWhatsappPhone(phone: string) {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("27")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+27${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

export function reminderKeyForStudy(date: string) {
  return `study-${date}`;
}

export function reminderKeyForBursary(bursaryId: string, deadline: string, daysBeforeDeadline: number) {
  return `bursary-${bursaryId}-${deadline}-${daysBeforeDeadline}`;
}
