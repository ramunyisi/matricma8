import { NextResponse } from "next/server";
import { z } from "zod";
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
import { demoProfile } from "@/lib/sample-data";

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) });

const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("stream"),
    messages: z.array(messageSchema).min(1),
    profile: z.any().optional(),
    focusSubject: z.string().optional(),
    coachMode: z.enum(["chat", "explain", "practice", "revise", "testMe", "markAnswer"]).optional(),
    grounding: z.any().optional()
  }),
  z.object({
    type: z.literal("followUp"),
    prompt: z.string().min(1),
    focusSubject: z.string().optional()
  }),
  z.object({
    type: z.literal("explain"),
    subject: z.string().min(1),
    grade: z.number().int().min(10).max(12),
    topic: z.string().min(1),
    question: z.string().min(1),
    grade10Mode: z.boolean().optional(),
    grounding: z.any().optional()
  }),
  z.object({
    type: z.literal("plan"),
    profile: z.any().optional(),
    grounding: z.any().optional()
  }),
  z.object({
    type: z.literal("practiceExplanation"),
    questionMetadata: z.any(),
    memoContext: z.string().optional()
  }),
  z.object({
    type: z.literal("relatedPracticeQuestion"),
    questionMetadata: z.any()
  }),
  z.object({
    type: z.literal("markAnswer"),
    subject: z.string().optional(),
    topic: z.string().optional(),
    question: z.string().optional(),
    learnerAnswer: z.string().min(1),
    grade: z.number().int().min(10).max(12).optional(),
    grounding: z.any().optional()
  })
]);

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());

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
        body.profile ?? null,
        body.grounding,
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
      const profile = body.profile ?? demoProfile;
      const marks = Object.fromEntries(profile.subjects.map((subject: { name: string; currentMark: number }) => [subject.name, subject.currentMark]));
      const targetMarks = Object.fromEntries(profile.subjects.map((subject: { name: string; targetMark: number }) => [subject.name, subject.targetMark]));
      const plan = await generateStudyPlan(profile, profile.subjects, marks, targetMarks, body.grounding);
      return NextResponse.json({ result: plan, verified: false });
    }

    if (body.type === "practiceExplanation") {
      const result = await generatePracticeExplanation(body.questionMetadata, body.memoContext);
      return NextResponse.json({ result, verified: false });
    }

    if (body.type === "relatedPracticeQuestion") {
      const result = await generateRelatedPracticeQuestion(body.questionMetadata);
      return NextResponse.json({ result, verified: false });
    }

    if (body.type === "markAnswer") {
      const result = await markLearnerAnswer({
        subject: body.subject,
        topic: body.topic,
        question: body.question,
        learnerAnswer: body.learnerAnswer,
        grade: body.grade,
        grounding: body.grounding
      });
      return NextResponse.json({ result, verified: false });
    }

    if (body.type === "followUp") {
      const result = await generateClarifyingQuestion(body.prompt, body.focusSubject);
      return NextResponse.json({ result, verified: false });
    }

    const result = await explainTopic(body.subject, body.grade, body.topic, body.question, body.grade10Mode, body.grounding);
    return NextResponse.json({ result, verified: false });
  } catch (error) {
    return NextResponse.json({ error: coachErrorMessage(error) }, { status: coachErrorStatus(error) });
  }
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
