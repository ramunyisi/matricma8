import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApsRule, Bursary, PastPaperQuestion } from "@/lib/types";
import { sampleApsRules, sampleBursaries, sampleQuestions } from "@/lib/sample-data";

export async function loadApsRules(supabase: SupabaseClient | null): Promise<ApsRule[]> {
  if (!supabase) return sampleApsRules;
  const { data, error } = await supabase.from("aps_rules").select("*").order("institution_name");
  if (error || !data || data.length === 0) return sampleApsRules;
  return data.map((row) => ({
    id: row.id,
    institutionName: row.institution_name,
    programmeName: row.programme_name,
    ruleJson: row.rule_json,
    minimumSubjectRequirementsJson: row.minimum_subject_requirements_json ?? [],
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at ?? "",
    sampleData: Boolean(row.rule_json?.sampleData)
  }));
}

export async function loadBursaries(supabase: SupabaseClient | null): Promise<Bursary[]> {
  if (!supabase) return sampleBursaries;
  const { data, error } = await supabase.from("bursaries").select("*").order("deadline", { ascending: true });
  if (error || !data || data.length === 0) return sampleBursaries;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    provider: row.provider,
    fieldOfStudy: row.field_of_study,
    minAverage: Number(row.min_average ?? 0),
    minSubjectRequirementsJson: row.min_subject_requirements_json ?? [],
    provinceRequirements: row.province_requirements ?? [],
    citizenshipRequirements: row.citizenship_requirements ?? "",
    deadline: row.deadline ?? "",
    applicationUrl: row.application_url,
    requiredDocumentsJson: row.required_documents_json ?? [],
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at ?? "",
    sampleData: row.provider?.includes("Demo") ?? false
  }));
}

type PaperQuestionRow = {
  id: string;
  question_number: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number | null;
  page_number: number | null;
  memo_page_number: number | null;
  topics: { name: string } | { name: string }[] | null;
  past_papers: {
    grade: 10 | 11 | 12;
    year: number;
    exam_session: string;
    paper_number: string;
    paper_url: string;
    memo_url: string | null;
    source_name: string;
    source_url: string;
    subjects: { name: string } | { name: string }[] | null;
  } | Array<{
    grade: 10 | 11 | 12;
    year: number;
    exam_session: string;
    paper_number: string;
    paper_url: string;
    memo_url: string | null;
    source_name: string;
    source_url: string;
    subjects: { name: string } | { name: string }[] | null;
  }> | null;
};

export async function loadPastPaperQuestions(supabase: SupabaseClient | null): Promise<PastPaperQuestion[]> {
  if (!supabase) return sampleQuestions;
  const { data, error } = await supabase
    .from("paper_questions")
    .select(`
      id,
      question_number,
      difficulty,
      marks,
      page_number,
      memo_page_number,
      topics ( name ),
      past_papers (
        grade,
        year,
        exam_session,
        paper_number,
        paper_url,
        memo_url,
        source_name,
        source_url,
        subjects ( name )
      )
    `)
    .order("question_number");

  if (error || !data || data.length === 0) return sampleQuestions;

  return (data as unknown as PaperQuestionRow[])
    .map((row) => {
      const paper = Array.isArray(row.past_papers) ? row.past_papers[0] : row.past_papers;
      const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
      const subject = Array.isArray(paper?.subjects) ? paper?.subjects[0] : paper?.subjects;
      if (!paper || !subject) return null;

      return {
        id: row.id,
        grade: paper.grade,
        subject: subject.name,
        topic: topic?.name ?? "General revision",
        difficulty: row.difficulty,
        year: paper.year,
        examSession: paper.exam_session,
        paperNumber: paper.paper_number,
        marks: row.marks ?? 0,
        pageNumber: row.page_number ?? 0,
        memoPageNumber: row.memo_page_number ?? 0,
        paperUrl: paper.paper_url,
        memoUrl: paper.memo_url ?? paper.source_url,
        sourceName: paper.source_name,
        sourceUrl: paper.source_url
      } satisfies PastPaperQuestion;
    })
    .filter((question): question is PastPaperQuestion => Boolean(question));
}
