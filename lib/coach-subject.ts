import type { LearnerSubject } from "@/lib/types";

export function inferCoachSubjectName(
  subjects: Pick<LearnerSubject, "name">[],
  messageText: string,
  fallback = "General"
) {
  const text = normalizeSubjectText(messageText);
  const matched = subjects.find((subject) => text.includes(normalizeSubjectText(subject.name)));
  return matched?.name ?? fallback;
}

export function normalizeSubjectText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
