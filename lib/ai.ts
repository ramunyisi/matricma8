import OpenAI from "openai";
import type { Bursary, LearnerProfile, LearnerSubject, PastPaperQuestion } from "@/lib/types";
import { matchBursaries } from "@/lib/bursaries";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { predictRisk as localPredictRisk } from "@/lib/aps";

const systemRules = `
You are MatricMate SA, an AI study coach for South African CAPS Grade 10-12 learners.
Be supportive, age-appropriate, and clear.
Use simple English by default.
Use South African school context.
Do not invent official facts, bursary deadlines, university requirements, paper contents, or DBE source details.
Always distinguish prediction from confirmed results.
When official data is missing or unverified, say it needs verification from stored source URLs or official institution/provider pages.
For learners under 18, encourage parent/guardian support for accounts, bursary applications, and sensitive decisions.
`;

export async function generateStudyPlan(profile: LearnerProfile, subjects: LearnerSubject[], marks: Record<string, number>, targetMarks: Record<string, number>) {
  const fallback = generateLocalStudyPlan({ ...profile, subjects });
  return runAiJson("Generate a 7-day study plan.", { profile, subjects, marks, targetMarks, fallback }, fallback);
}

export async function explainTopic(subject: string, grade: number, topic: string, learnerQuestion: string, grade10Mode = false) {
  const fallback = `${topic}: start with the key CAPS idea, work through one example, then practise a past-paper question. This explanation is not an official memo and should be checked against your teacher or DBE materials.`;
  return runAiText("Explain a CAPS topic simply.", { subject, grade, topic, learnerQuestion, grade10Mode }, fallback);
}

export function predictRisk(currentMarks: Record<string, number>, targetMarks: Record<string, number>) {
  return localPredictRisk(currentMarks, targetMarks);
}

export async function generatePracticeExplanation(questionMetadata: PastPaperQuestion, memoContext?: string) {
  const fallback = `Use the linked official paper and memo. For ${questionMetadata.topic}, identify the command word, list known facts or formulas, answer step by step, then compare with the memo page.`;
  return runAiText("Generate a practice explanation from metadata and optional memo context.", { questionMetadata, memoContext }, fallback);
}

export function recommendBursaries(profile: LearnerProfile, bursaries: Bursary[]) {
  return matchBursaries(profile, bursaries);
}

async function runAiText(task: string, payload: unknown, fallback: string) {
  if (!process.env.OPENAI_API_KEY) return fallback;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: systemRules },
      { role: "user", content: `${task}\n\nContext:\n${JSON.stringify(payload, null, 2)}` }
    ]
  });
  return response.choices[0]?.message.content ?? fallback;
}

async function runAiJson<T>(task: string, payload: unknown, fallback: T): Promise<T> {
  if (!process.env.OPENAI_API_KEY) return fallback;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${systemRules}\nReturn valid JSON only.` },
      { role: "user", content: `${task}\n\nContext:\n${JSON.stringify(payload, null, 2)}` }
    ]
  });
  const content = response.choices[0]?.message.content;
  if (!content) return fallback;
  return JSON.parse(content) as T;
}
