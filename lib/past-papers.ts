import type { PastPaper, PastPaperQuestion } from "@/lib/types";

export type PaperFilters = {
  grade?: number;
  subject?: string;
  topic?: string;
  difficulty?: string;
  year?: number;
  query?: string;
};

export function filterPastPaperQuestions(questions: PastPaperQuestion[], filters: PaperFilters) {
  const terms = normalise(filters.query).split(" ").filter(Boolean);

  return questions.filter((question) => {
    if (filters.grade && question.grade !== filters.grade) return false;
    if (filters.subject && filters.subject !== "All" && question.subject !== filters.subject) return false;
    if (filters.topic && filters.topic !== "All" && question.topic !== filters.topic) return false;
    if (filters.difficulty && filters.difficulty !== "All" && question.difficulty !== filters.difficulty) return false;
    if (filters.year && question.year !== filters.year) return false;
    if (terms.length > 0) {
      const haystack = normalise([
        question.subject,
        question.topic,
        question.paperNumber,
        question.questionNumber,
        question.questionText,
        question.examSession,
        question.year,
        question.difficulty,
        question.sourceName,
        question.sourceUrl,
        question.id
      ].join(" "));
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  }).sort((a, b) => b.year - a.year || a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic));
}

export function filterPastPapers(papers: PastPaper[], filters: PaperFilters) {
  const terms = normalise(filters.query).split(" ").filter(Boolean);

  return papers.filter((paper) => {
    if (filters.grade && paper.grade !== filters.grade) return false;
    if (filters.subject && filters.subject !== "All" && paper.subject !== filters.subject) return false;
    if (filters.year && paper.year !== filters.year) return false;
    if (terms.length > 0) {
      const haystack = normalise([
        paper.subject,
        paper.year,
        paper.examSession,
        paper.paperNumber,
        paper.paperFilename,
        paper.memoFilename,
        paper.language,
        paper.collectionTitle,
        paper.sourceName,
        paper.sourceUrl,
        paper.paperUrl,
        paper.memoUrl,
        paper.id
      ].join(" "));
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  }).sort((a, b) => b.year - a.year || a.subject.localeCompare(b.subject) || a.paperNumber.localeCompare(b.paperNumber));
}

function normalise(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
