import { NextResponse } from "next/server";
import { z } from "zod";
import { explainTopic, generatePracticeExplanation, generateRelatedPracticeQuestion, generateStudyPlan } from "@/lib/ai";
import { demoProfile } from "@/lib/sample-data";

const requestSchema = z.discriminatedUnion("type", [
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
  })
]);

export async function POST(request: Request) {
  const body = requestSchema.parse(await request.json());

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

  const result = await explainTopic(body.subject, body.grade, body.topic, body.question, body.grade10Mode, body.grounding);
  return NextResponse.json({ result, verified: false });
}
