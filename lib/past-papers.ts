import type { PastPaperQuestion } from "@/lib/types";

export type PaperFilters = {
  grade?: number;
  subject?: string;
  topic?: string;
  difficulty?: string;
  year?: number;
};

export function filterPastPaperQuestions(questions: PastPaperQuestion[], filters: PaperFilters) {
  return questions.filter((question) => {
    if (filters.grade && question.grade !== filters.grade) return false;
    if (filters.subject && filters.subject !== "All" && question.subject !== filters.subject) return false;
    if (filters.topic && filters.topic !== "All" && question.topic !== filters.topic) return false;
    if (filters.difficulty && filters.difficulty !== "All" && question.difficulty !== filters.difficulty) return false;
    if (filters.year && question.year !== filters.year) return false;
    return true;
  });
}
