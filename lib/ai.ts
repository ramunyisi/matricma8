import { GoogleGenAI } from "@google/genai";
import type { Bursary, LearnerProfile, LearnerSubject, PastPaperQuestion } from "@/lib/types";

export type ConversationMessage = { role: "user" | "assistant"; content: string };
import { matchBursaries } from "@/lib/bursaries";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { predictRisk as localPredictRisk } from "@/lib/aps";

const systemRules = `
You are MatricSA, an AI study coach for South African CAPS Grade 10-12 learners.
Be supportive, age-appropriate, and clear.
Use simple English by default.
Use South African school context.
Do not invent official facts, bursary deadlines, university requirements, paper contents, or DBE source details.
Always distinguish prediction from confirmed results.
When official data is missing or unverified, say it needs verification from stored source URLs or official institution/provider pages.
For learners under 18, encourage parent/guardian support for accounts, bursary applications, and sensitive decisions.

You are a Grade 12 Mathematics tutor following the South African CAPS curriculum.

Always:
- Explain concepts simply
- Show step-by-step solutions
- Use South African exam terminology
- Generate practice questions
- Never just give answers
`;

const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export type AiGroundingContext = {
  apsRules?: unknown[];
  bursaries?: unknown[];
  pastPaperQuestions?: unknown[];
};

export async function generateStudyPlan(profile: LearnerProfile, subjects: LearnerSubject[], marks: Record<string, number>, targetMarks: Record<string, number>, grounding?: AiGroundingContext) {
  const fallback = generateLocalStudyPlan({ ...profile, subjects });
  return runAiJson("Generate a 7-day study plan.", { profile, subjects, marks, targetMarks, grounding, fallback }, fallback);
}

export async function explainTopic(subject: string, grade: number, topic: string, learnerQuestion: string, grade10Mode = false, grounding?: AiGroundingContext) {
  const fallback = `${topic}: start with the key CAPS idea, work through one example, then practise a past-paper question. This explanation is not an official memo and should be checked against your teacher or DBE materials.`;
  return runAiText("Explain a CAPS topic simply.", { subject, grade, topic, learnerQuestion, grade10Mode, grounding }, fallback);
}

export function predictRisk(currentMarks: Record<string, number>, targetMarks: Record<string, number>) {
  return localPredictRisk(currentMarks, targetMarks);
}

export async function generatePracticeExplanation(questionMetadata: PastPaperQuestion, memoContext?: string) {
  const fallback = `Use the linked official paper and memo. For ${questionMetadata.topic}, identify the command word, list known facts or formulas, answer step by step, then compare with the memo page.`;
  return runAiText("Generate a practice explanation from metadata and optional memo context.", { questionMetadata, memoContext }, fallback);
}

export async function generateRelatedPracticeQuestion(questionMetadata: PastPaperQuestion) {
  const fallback = [
    `Original practice question related to ${questionMetadata.topic}:`,
    `A Grade ${questionMetadata.grade} learner is revising ${questionMetadata.subject} ${questionMetadata.paperNumber}. Create a short problem on ${questionMetadata.topic}, then solve it step by step.`,
    "",
    "Solution approach:",
    "1. Identify the key concept or formula.",
    "2. Substitute the given values carefully.",
    "3. Simplify one line at a time.",
    "4. Check the answer against the conditions in the question.",
    "",
    "This is AI-generated practice, not the official paper question or memo."
  ].join("\n");

  return runAiText(
    [
      "Generate one original CAPS-aligned practice question related to this past-paper metadata.",
      "Then provide a clear step-by-step solution.",
      "Do not copy or claim to reproduce the official question.",
      "Do not invent official memo content.",
      "Use simple South African school English.",
      "Include a short note that the learner can download the linked paper for official practice."
    ].join(" "),
    { questionMetadata },
    fallback
  );
}

export async function* streamCoachResponse(
  messages: ConversationMessage[],
  profile: LearnerProfile | null,
  grounding?: AiGroundingContext,
  mode: "web" | "whatsapp" = "web",
  focusSubject?: string
): AsyncGenerator<string> {
  if (!geminiApiKey) {
    yield "AI coaching is not configured. Set GEMINI_API_KEY in your environment.";
    return;
  }

  const client = new GoogleGenAI({ apiKey: geminiApiKey });

  const whatsappNote =
    mode === "whatsapp"
      ? "\n\nFor WhatsApp: keep responses under 400 words. Use plain text. Use *bold* for key terms only."
      : "";

  let contextPrefix = systemRules + whatsappNote + "\n\n";
  if (profile) {
    const subjectList = profile.subjects.map((s) => `${s.name}: ${s.currentMark}%/${s.targetMark}%`).join(", ");
    contextPrefix += `Learner: Grade ${profile.grade}, Province ${profile.province}, Subjects — ${subjectList}.\n\n`;
  }
  if (focusSubject) {
    contextPrefix += `The learner is currently focusing on ${focusSubject}. Prioritise explanations for this subject unless they ask about something else.\n\n`;
  }
  if (grounding) {
    contextPrefix += `Reference data: ${JSON.stringify(grounding)}\n\n`;
  }

  const contents = messages.map((msg, index) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: index === 0 ? contextPrefix + msg.content : msg.content }]
  }));

  try {
    const stream = await client.models.generateContentStream({
      model: geminiModel,
      contents,
      config: { temperature: 0.4 }
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    yield mode === "whatsapp"
      ? "Sorry, I'm having trouble right now. Please try again in a moment."
      : `\n\n*Coach unavailable: ${message}. Please try again.*`;
  }
}

export function recommendBursaries(profile: LearnerProfile, bursaries: Bursary[]) {
  return matchBursaries(profile, bursaries);
}

async function runAiText(task: string, payload: unknown, fallback: string) {
  if (!geminiApiKey) return fallback;
  try {
    const client = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: `${systemRules}\n\n${task}\n\nContext:\n${JSON.stringify(payload, null, 2)}`,
      config: { temperature: 0.4 }
    });
    return response.text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function runAiJson<T>(task: string, payload: unknown, fallback: T): Promise<T> {
  if (!geminiApiKey) return fallback;
  try {
    const client = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: `${systemRules}\nReturn valid JSON only.\n\n${task}\n\nContext:\n${JSON.stringify(payload, null, 2)}`,
      config: { temperature: 0.35 }
    });
    const parsed = parseJsonResponse<T>(response.text);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function parseJsonResponse<T>(value?: string | null): T | null {
  if (!value) return null;
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], trimmed];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(candidate.slice(start, end + 1)) as T;
        } catch {
          // keep trying
        }
      }
    }
  }

  return null;
}
