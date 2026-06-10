import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnswerReview, CoachMode } from "@/lib/ai";
import type { CoachTopicMemory } from "@/lib/types";

export async function loadCoachMemory(supabase: SupabaseClient, learnerId: string, limit = 8): Promise<CoachTopicMemory[]> {
  const { data, error } = await supabase
    .from("coach_topic_memory")
    .select("*")
    .eq("learner_id", learnerId)
    .order("struggle_count", { ascending: false })
    .order("last_seen_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapMemoryRow);
}

export async function recordCoachMemory(
  supabase: SupabaseClient,
  learnerId: string,
  payload: {
    subjectName: string;
    topicLabel: string;
    mode: CoachMode;
    question?: string;
    answer?: string;
    summary?: string;
    review?: AnswerReview | null;
  }
) {
  const topicKey = deriveCoachTopicKey(payload.subjectName, payload.topicLabel);
  const { data: existing, error: loadError } = await supabase
    .from("coach_topic_memory")
    .select("*")
    .eq("learner_id", learnerId)
    .eq("topic_key", topicKey)
    .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message);
  }

  const current = existing ? mapMemoryRow(existing) : null;
  const now = new Date().toISOString();
  const review = payload.review ?? null;
  const isReviewMode = payload.mode === "markAnswer";
  const inferredStruggle = review ? Math.max(1, Math.min(5, Math.round(review.likelyMarksLost))) : isReviewMode ? 1 : 0;
  const inferredSuccess = review
    ? review.confidence === "high"
      ? 1
      : 0
    : payload.mode === "explain" || payload.mode === "practice"
      ? 1
      : 0;

  const row = {
    learner_id: learnerId,
    subject_name: payload.subjectName,
    topic_key: topicKey,
    topic_label: payload.topicLabel,
    session_count: (current?.sessionCount ?? 0) + 1,
    question_count: (current?.questionCount ?? 0) + (payload.question ? 1 : 0),
    struggle_count: (current?.struggleCount ?? 0) + inferredStruggle,
    success_count: (current?.successCount ?? 0) + inferredSuccess,
    last_mode: payload.mode,
    last_summary: payload.summary ?? review?.summary ?? current?.lastSummary ?? null,
    last_question: payload.question ?? current?.lastQuestion ?? null,
    last_answer: payload.answer ?? current?.lastAnswer ?? null,
    last_seen_at: now,
    updated_at: now
  };

  const { error } = await supabase.from("coach_topic_memory").upsert(row, { onConflict: "learner_id,topic_key" });
  if (error) {
    throw new Error(error.message);
  }
}

export function deriveCoachTopicKey(subjectName: string, topicLabel: string) {
  return `${subjectName} :: ${topicLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function sortCoachMemory(memory: CoachTopicMemory[]) {
  return [...memory].sort((a, b) => {
    const aScore = a.struggleCount * 2 - a.successCount;
    const bScore = b.struggleCount * 2 - b.successCount;
    if (bScore !== aScore) return bScore - aScore;
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
  });
}

export function summarizeCoachMemory(memory: CoachTopicMemory[]) {
  const sorted = sortCoachMemory(memory).slice(0, 5);
  return sorted.map((item) => ({
    subjectName: item.subjectName,
    topicLabel: item.topicLabel,
    sessionCount: item.sessionCount,
    questionCount: item.questionCount,
    struggleCount: item.struggleCount,
    successCount: item.successCount,
    lastMode: item.lastMode,
    lastSummary: item.lastSummary,
    lastSeenAt: item.lastSeenAt
  }));
}

function mapMemoryRow(row: Record<string, unknown>): CoachTopicMemory {
  return {
    id: String(row.id ?? ""),
    learnerId: String(row.learner_id ?? ""),
    subjectName: String(row.subject_name ?? ""),
    topicKey: String(row.topic_key ?? ""),
    topicLabel: String(row.topic_label ?? ""),
    sessionCount: Number(row.session_count ?? 0),
    questionCount: Number(row.question_count ?? 0),
    struggleCount: Number(row.struggle_count ?? 0),
    successCount: Number(row.success_count ?? 0),
    lastMode: normalizeCoachMode(row.last_mode),
    lastSummary: typeof row.last_summary === "string" ? row.last_summary : undefined,
    lastQuestion: typeof row.last_question === "string" ? row.last_question : undefined,
    lastAnswer: typeof row.last_answer === "string" ? row.last_answer : undefined,
    lastSeenAt: String(row.last_seen_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

function normalizeCoachMode(value: unknown): CoachMode {
  return value === "explain" || value === "practice" || value === "revise" || value === "testMe" || value === "markAnswer"
    ? value
    : "chat";
}
