import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApsRule, Bursary, CapsContentItem, CapsContentSection, PastPaper, PastPaperQuestion } from "@/lib/types";
import { sampleApsRules, sampleQuestions } from "@/lib/sample-data";
import { verifiedBursaries } from "@/lib/bursary-directory";
import { capsContentLibrary, capsContentSections } from "@/lib/caps-content";

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
    prospectusUrl: row.prospectus_url ?? undefined,
    prospectusNotes: row.prospectus_notes ?? [],
    sampleData: Boolean(row.rule_json?.sampleData)
  }));
}

export async function loadBursaries(supabase: SupabaseClient | null): Promise<Bursary[]> {
  if (!supabase) return verifiedBursaries;
  const { data, error } = await supabase.from("bursaries").select("*").order("deadline", { ascending: true });
  if (error || !data || data.length === 0) return verifiedBursaries;
  const mapped = data.map((row) => ({
    id: row.id,
    name: row.name,
    provider: row.provider,
    fieldOfStudy: row.field_of_study,
    fundingType: row.funding_type ?? undefined,
    studyLevels: row.study_levels ?? [],
    eligibilityCriteriaJson: row.eligibility_criteria_json ?? [],
    minAverage: Number(row.min_average ?? 0),
    minSubjectRequirementsJson: row.min_subject_requirements_json ?? [],
    provinceRequirements: row.province_requirements ?? [],
    citizenshipRequirements: row.citizenship_requirements ?? "",
    deadline: row.deadline ?? "",
    officialStatus: row.official_status ?? undefined,
    applicationUrl: row.application_url,
    requiredDocumentsJson: row.required_documents_json ?? [],
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at ?? "",
    lastCheckedAt: row.last_checked_at ?? undefined,
    sampleData: row.provider?.includes("Demo") ?? false,
    applicationWindow: row.application_window ?? undefined,
    summary: row.summary ?? undefined,
    notes: row.notes ?? undefined
  }));

  const nonDemo = mapped.filter((bursary) => !bursary.sampleData && !bursary.provider.toLowerCase().includes("demo"));
  return nonDemo.length > 0 ? nonDemo : verifiedBursaries;
}

type PaperQuestionRow = {
  id: string;
  question_number: string;
  question_text_optional: string | null;
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

type PastPaperRow = {
  id: string;
  grade: 10 | 11 | 12;
  year: number;
  exam_session: string;
  paper_number: string;
  paper_url: string;
  memo_url: string | null;
  language: string | null;
  collection_title: string | null;
  source_name: string;
  source_url: string;
  subjects: { name: string } | { name: string }[] | null;
};

export async function loadPastPapers(supabase: SupabaseClient | null): Promise<PastPaper[]> {
  if (!supabase) return samplePastPapers();
  const { data, error } = await supabase
    .from("past_papers")
    .select(`
      id,
      grade,
      year,
      exam_session,
      paper_number,
      paper_url,
      memo_url,
      language,
      collection_title,
      source_name,
      source_url,
      subjects ( name )
    `)
    .order("year", { ascending: false })
    .order("paper_number", { ascending: true });

  if (error || !data || data.length === 0) return samplePastPapers();

  const mapped = (data as unknown as PastPaperRow[])
    .map((row): PastPaper | null => {
      const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
      if (!subject) return null;

      return {
        id: row.id,
        grade: row.grade,
        subject: subject.name,
        year: row.year,
        examSession: row.exam_session,
        paperNumber: row.paper_number,
        paperUrl: row.paper_url,
        memoUrl: row.memo_url ?? undefined,
        paperFilename: filenameFromUrl(row.paper_url, `${subject.name} ${row.year} ${row.paper_number}.pdf`),
        memoFilename: row.memo_url ? filenameFromUrl(row.memo_url, `${subject.name} ${row.year} ${row.paper_number} memo.pdf`) : undefined,
        language: row.language ?? undefined,
        collectionTitle: row.collection_title ?? undefined,
        sourceName: row.source_name,
        sourceUrl: row.source_url
      } satisfies PastPaper;
    })
    .filter((paper): paper is PastPaper => Boolean(paper));

  return mapped.length > 0 ? mapped : samplePastPapers();
}

export async function loadPastPaperQuestions(supabase: SupabaseClient | null): Promise<PastPaperQuestion[]> {
  if (!supabase) return sampleQuestions;
  const { data, error } = await supabase
    .from("paper_questions")
    .select(`
      id,
      question_number,
      question_text_optional,
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

  const mapped = (data as unknown as PaperQuestionRow[])
    .map((row): PastPaperQuestion | null => {
      const paper = Array.isArray(row.past_papers) ? row.past_papers[0] : row.past_papers;
      const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
      const subject = Array.isArray(paper?.subjects) ? paper?.subjects[0] : paper?.subjects;
      if (!paper || !subject) return null;

      return {
        id: row.id,
        questionNumber: row.question_number,
        questionText: row.question_text_optional ?? undefined,
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

  return mapped;
}

export async function loadCapsContent(): Promise<CapsContentItem[]> {
  return capsContentLibrary;
}

export async function loadCapsSections(): Promise<CapsContentSection[]> {
  return capsContentSections;
}

function samplePastPapers(): PastPaper[] {
  const papers = new Map<string, PastPaper>();

  for (const question of sampleQuestions) {
    const key = [question.grade, question.subject, question.year, question.examSession, question.paperNumber, question.paperUrl, question.memoUrl].join("|");
    if (!papers.has(key)) {
      papers.set(key, {
        id: `sample-${papers.size + 1}`,
        grade: question.grade,
        subject: question.subject,
        year: question.year,
        examSession: question.examSession,
        paperNumber: question.paperNumber,
        paperUrl: question.paperUrl,
        memoUrl: question.memoUrl,
        paperFilename: filenameFromUrl(question.paperUrl, `${question.subject} ${question.year} ${question.paperNumber}.pdf`),
        memoFilename: filenameFromUrl(question.memoUrl, `${question.subject} ${question.year} ${question.paperNumber} memo.pdf`),
        language: undefined,
        collectionTitle: `${question.year} ${question.examSession}`,
        sourceName: question.sourceName,
        sourceUrl: question.sourceUrl,
        sampleData: true
      });
    }
  }

  return Array.from(papers.values());
}

function filenameFromUrl(value: string, fallback: string) {
  const localPrefix = "local://past_papers/";
  const storagePrefix = "storage://past-papers/";

  if (value.startsWith(localPrefix)) {
    return decodeURIComponent(value.slice(localPrefix.length));
  }

  if (value.startsWith(storagePrefix)) {
    return decodeURIComponent(value.slice(storagePrefix.length).split("/").pop() ?? fallback);
  }

  try {
    const url = new URL(value);
    const file = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    return !file || /^linkclick\.aspx$/i.test(file) ? fallback : file;
  } catch {
    return fallback;
  }
}
