import { NextResponse } from "next/server";
import { z } from "zod";
import { explainTopic, generateStudyPlan } from "@/lib/ai";
import { demoProfile } from "@/lib/sample-data";

const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("explain"),
    subject: z.string().min(1),
    grade: z.number().int().min(10).max(12),
    topic: z.string().min(1),
    question: z.string().min(1),
    grade10Mode: z.boolean().optional()
  }),
  z.object({
    type: z.literal("plan"),
    profile: z.any().optional()
  })
]);

export async function POST(request: Request) {
  const body = requestSchema.parse(await request.json());

  if (body.type === "plan") {
    const profile = body.profile ?? demoProfile;
    const marks = Object.fromEntries(profile.subjects.map((subject: { name: string; currentMark: number }) => [subject.name, subject.currentMark]));
    const targetMarks = Object.fromEntries(profile.subjects.map((subject: { name: string; targetMark: number }) => [subject.name, subject.targetMark]));
    const plan = await generateStudyPlan(profile, profile.subjects, marks, targetMarks);
    return NextResponse.json({ result: plan, verified: false });
  }

  const result = await explainTopic(body.subject, body.grade, body.topic, body.question, body.grade10Mode);
  return NextResponse.json({ result, verified: false });
}
