import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  explainTopic,
  generateClarifyingQuestion,
  generatePracticeExplanation,
  generateRelatedPracticeQuestion,
  generateStudyPlan,
  markLearnerAnswer,
  shouldAskForClarification,
  streamCoachResponse
} from "@/lib/ai";
import { requireAuthenticatedUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { demoProfile } from "@/lib/sample-data";
import type { AiGroundingContext } from "@/lib/ai";
import type { InternetAccessLevel, LearnerProfile, LearnerSubject, PastPaperQuestion } from "@/lib/types";

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });
const groundingSchema = z.object({
  apsRules: z.array(z.unknown()).optional(),
  bursaries: z.array(z.unknown()).optional(),
  pastPaperQuestions: z.array(z.unknown()).optional(),
  capsSections: z.array(z.unknown()).optional(),
  coachMemory: z.array(z.unknown()).optional()
}).optional();

const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("stream"),
    messages: z.array(messageSchema).min(1).max(16),
    profile: z.any().optional(),
    focusSubject: z.string().max(120).optional(),
    coachMode: z.enum(["chat", "explain", "practice", "revise", "testMe", "markAnswer"]).optional(),
    grounding: groundingSchema
  }),
  z.object({
    type: z.literal("followUp"),
    prompt: z.string().min(1).max(1000),
    focusSubject: z.string().max(120).optional()
  }),
  z.object({
    type: z.literal("explain"),
    subject: z.string().min(1).max(120),
    grade: z.number().int().min(10).max(12),
    topic: z.string().min(1).max(240),
    question: z.string().min(1).max(2000),
    grade10Mode: z.boolean().optional(),
    grounding: groundingSchema
  }),
  z.object({
    type: z.literal("plan"),
    profile: z.any().optional(),
    grounding: groundingSchema
  }),
  z.object({
    type: z.literal("practiceExplanation"),
    questionMetadata: z.unknown(),
    memoContext: z.string().max(4000).optional()
  }),
  z.object({
    type: z.literal("relatedPracticeQuestion"),
    questionMetadata: z.unknown()
  }),
  z.object({
    type: z.literal("markAnswer"),
    subject: z.string().max(120).optional(),
    topic: z.string().max(240).optional(),
    question: z.string().max(2000).optional(),
    learnerAnswer: z.string().min(1).max(6000),
    grade: z.number().int().min(10).max(12).optional(),
    grounding: groundingSchema
  })
]);

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rate = checkRateLimit(`coach:${auth.user.id}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many coach requests. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } }
      );
    }

    const body = requestSchema.parse(await request.json());
    const profile = await loadLearnerProfileForUser(auth.supabase, auth.user.id);
    const learnerProfile = profile ?? demoProfile;
    const grounding = capGrounding("grounding" in body ? body.grounding : undefined);

    if (body.type === "stream") {
      const lastUserMessage = [...body.messages].reverse().find((message) => message.role === "user")?.content ?? "";
      if (shouldAskForClarification(lastUserMessage, body.focusSubject)) {
        const clarification = await generateClarifyingQuestion(lastUserMessage, body.focusSubject);
        return new Response(clarification, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" }
        });
      }
      const encoder = new TextEncoder();
      const generator = streamCoachResponse(
        body.messages,
        profile,
        grounding,
        "web",
        body.focusSubject,
        body.coachMode ?? "chat"
      );
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of generator) {
              controller.enqueue(encoder.encode(chunk));
            }
          } finally {
            controller.close();
          }
        }
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" }
      });
    }

    if (body.type === "plan") {
      const marks = Object.fromEntries(learnerProfile.subjects.map((subject) => [subject.name, subject.currentMark]));
      const targetMarks = Object.fromEntries(learnerProfile.subjects.map((subject) => [subject.name, subject.targetMark]));
      const plan = await generateStudyPlan(learnerProfile, learnerProfile.subjects, marks, targetMarks, grounding);
      return NextResponse.json({ result: plan, verified: false });
    }

    if (body.type === "practiceExplanation") {
      const result = await generatePracticeExplanation(body.questionMetadata as PastPaperQuestion, body.memoContext);
      return NextResponse.json({ result, verified: false });
    }

    if (body.type === "relatedPracticeQuestion") {
      const result = await generateRelatedPracticeQuestion(body.questionMetadata as PastPaperQuestion);
      return NextResponse.json({ result, verified: false });
    }

    if (body.type === "markAnswer") {
      const result = await markLearnerAnswer({
        subject: body.subject,
        topic: body.topic,
        question: body.question,
        learnerAnswer: body.learnerAnswer,
        grade: body.grade ?? learnerProfile.grade,
        grounding
      });
      return NextResponse.json({ result, verified: false });
    }

    if (body.type === "followUp") {
      const result = await generateClarifyingQuestion(body.prompt, body.focusSubject);
      return NextResponse.json({ result, verified: false });
    }

    const result = await explainTopic(body.subject, body.grade, body.topic, body.question, body.grade10Mode, grounding);
    return NextResponse.json({ result, verified: false });
  } catch (error) {
    return NextResponse.json({ error: coachErrorMessage(error) }, { status: coachErrorStatus(error) });
  }
}

type LearnerProfileRow = {
  id: string;
  grade: 10 | 11 | 12;
  province: string;
  school_name: string | null;
  home_language: string;
  internet_access_level: InternetAccessLevel;
  career_interests: string[] | null;
  preferred_study_times: string[] | null;
  exam_date: string | null;
  learner_subjects?: Array<{
    id: string;
    current_mark: number | string;
    target_mark: number | string;
    subjects: { id: string; name: string; grade: 10 | 11 | 12 } | null | Array<{ id: string; name: string; grade: 10 | 11 | 12 }>;
  }>;
};

async function loadLearnerProfileForUser(supabase: SupabaseClient, userId: string): Promise<LearnerProfile | null> {
  const { data, error } = await supabase
    .from("learner_profiles")
    .select(`
      id,
      grade,
      province,
      school_name,
      home_language,
      internet_access_level,
      career_interests,
      preferred_study_times,
      exam_date,
      learner_subjects (
        id,
        current_mark,
        target_mark,
        subjects (
          id,
          name,
          grade
        )
      )
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as LearnerProfileRow;
  const subjects: LearnerSubject[] = [];
  for (const item of row.learner_subjects ?? []) {
    const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
    if (!subject) continue;
    subjects.push({
      id: item.id,
      subjectId: subject.id,
      name: subject.name,
      grade: subject.grade,
      currentMark: Number(item.current_mark),
      targetMark: Number(item.target_mark)
    });
  }

  return {
    id: row.id,
    grade: row.grade,
    province: row.province,
    schoolName: row.school_name ?? undefined,
    homeLanguage: row.home_language,
    internetAccessLevel: row.internet_access_level,
    careerInterests: row.career_interests ?? [],
    preferredStudyTimes: row.preferred_study_times ?? [],
    examDate: row.exam_date ?? demoProfile.examDate,
    subjects
  };
}

function capGrounding(grounding: AiGroundingContext | undefined): AiGroundingContext | undefined {
  if (!grounding) return undefined;
  return {
    apsRules: grounding.apsRules?.slice(0, 8),
    bursaries: grounding.bursaries?.slice(0, 8),
    pastPaperQuestions: grounding.pastPaperQuestions?.slice(0, 8),
    capsSections: grounding.capsSections?.slice(0, 6),
    coachMemory: grounding.coachMemory?.slice(0, 8)
  };
}

function coachErrorMessage(error: unknown) {
  const typed = error as { status?: number; code?: string; message?: string };
  if (typed.status === 401 || typed.code === "invalid_api_key") {
    return "Gemini rejected the API key. Create a new key in Google AI Studio, update GEMINI_API_KEY or GOOGLE_API_KEY in .env.local, and restart the dev server.";
  }
  if (typed.status === 429) return "Gemini rate limit or quota reached. Check your Google AI billing and usage limits.";
  if (typed.message) return typed.message;
  return "Could not generate an AI response.";
}

function coachErrorStatus(error: unknown) {
  const typed = error as { status?: number; code?: string };
  if (typed.status === 401 || typed.code === "invalid_api_key") return 401;
  if (typed.status === 429) return 429;
  return 500;
}
