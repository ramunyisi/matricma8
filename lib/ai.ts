import { GoogleGenAI } from "@google/genai";
import type { Bursary, CapsContentSection, LearnerProfile, LearnerSubject, PastPaperQuestion } from "@/lib/types";
import { matchBursaries } from "@/lib/bursaries";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { predictRisk as localPredictRisk } from "@/lib/aps";

export type ConversationMessage = { role: "user" | "assistant"; content: string };
export type CoachMode = "chat" | "explain" | "practice" | "revise" | "testMe" | "markAnswer";
export type AnswerReview = {
  summary: string;
  strengths: string[];
  improvements: string[];
  likelyMarksLost: number;
  nextStep: string;
  modelAnswer?: string;
  confidence: "low" | "medium" | "high";
};

const systemRules = `
You are MatricSA, an AI study coach for South African CAPS Grade 10-12 learners.
Be supportive, age-appropriate, and clear.
Use simple English by default.
Use South African school context.
Do not invent official facts, bursary deadlines, university requirements, paper contents, or DBE source details.
Always distinguish prediction from confirmed results.
When official data is missing or unverified, say it needs verification from stored source URLs or official institution/provider pages.
For learners under 18, encourage parent/guardian support for accounts, bursary applications, and sensitive decisions.

You are a Grade 12 CAPS tutor for the learner's current subject.
Never assume Mathematics unless the learner explicitly asks for Mathematics.
If a subject is provided, stay on that subject and use its exam terminology.
When answering, keep the structure visible to the learner: start with the direct answer, then a short explanation, then one worked or check example where useful, then one next step.
When source labels or stored reference data are relevant, mention them briefly and clearly so the learner knows what was grounded.

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
  capsSections?: unknown[];
  coachMemory?: unknown[];
};

export function shouldAskForClarification(prompt: string, focusSubject?: string) {
  const trimmed = prompt.trim();
  if (!trimmed) return true;
  if (trimmed.length < 18) return true;
  if (/^(help|explain|study|practice|revise|test me|what is this|i don't understand|dont understand)$/i.test(trimmed)) {
    return true;
  }
  if (!focusSubject && trimmed.length < 24) return true;
  return false;
}

export function buildCoachInstructions(mode: CoachMode, focusSubject?: string) {
  const subjectLine = focusSubject
    ? [
        `The learner's current subject is ${focusSubject}.`,
        `Use ${focusSubject} terminology and examples unless the learner explicitly switches to another subject.`,
        `Do not treat Mathematics as the default subject.`
      ].join("\n")
    : "Use the subject named by the learner. Do not assume Mathematics as a default.";
  const modeInstructions: Record<CoachMode, string> = {
    chat: "Answer naturally and keep the tone supportive. End with one clear next step.",
    explain: "Teach the concept clearly, then show one worked example and one quick check question. Keep the structure short and visible.",
    practice: "Set one CAPS-aligned practice question first, then give a step-by-step solution and a short note on the exam method.",
    revise: "Give a compact revision summary, key formulas or facts, common mistakes, and a short memory aid.",
    testMe: "Ask one exam-style question only. Do not solve it unless the learner asks for the answer after trying.",
    markAnswer: "Assess the learner's answer, identify what is correct, where marks are lost, and how to improve. Show likely marks earned, then one corrected version."
  };

  return [
    `Current coaching mode: ${mode}.`,
    modeInstructions[mode],
    subjectLine,
    "If the prompt is vague or missing the topic, ask one short clarifying question instead of guessing.",
    "If the learner mentions a subject in the latest message, prioritize that subject over any previous default.",
    "If grounding data is available, use it cautiously and label it as stored reference data rather than an official source unless it is explicitly official."
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMemoryGuidance(memory: unknown): string {
  if (!Array.isArray(memory) || memory.length === 0) return "";
  const weakTopics = memory
    .slice(0, 3)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as {
        subjectName?: string;
        topicLabel?: string;
        struggleCount?: number;
        sessionCount?: number;
        lastSummary?: string;
      };
      if (!typed.topicLabel) return null;
      const subjectName = typed.subjectName ?? "General";
      const struggle = typeof typed.struggleCount === "number" ? typed.struggleCount : 0;
      const sessions = typeof typed.sessionCount === "number" ? typed.sessionCount : 0;
      return `- ${subjectName}: ${typed.topicLabel} (sessions ${sessions}, struggle ${struggle})${typed.lastSummary ? ` — last summary: ${typed.lastSummary}` : ""}`;
    })
    .filter((item): item is string => Boolean(item));

  if (weakTopics.length === 0) return "";
  return [
    "Top weak areas from learner history:",
    ...weakTopics,
    "Start your response by addressing the strongest weak area first.",
    "If the learner is asking for practice, give one short drill that targets that weak area.",
    "If the learner is asking for revision, give the key rule/formula for that weak area before anything else."
  ].join("\n");
}

function buildCapsGuidance(sections: unknown): string {
  if (!Array.isArray(sections) || sections.length === 0) return "";
  const items = sections
    .slice(0, 4)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as Partial<CapsContentSection>;
      if (!typed.sectionTitle || !typed.sectionSummary || !typed.sourceUrl) return null;
      const subject = typed.subject ?? "All subjects";
      const grade = typed.grade === "all" || typeof typed.grade === "undefined" ? "all" : `Grade ${typed.grade}`;
      return `- ${typed.sectionTitle} (${subject}, ${grade}): ${typed.sectionSummary} [${typed.sourceUrl}]`;
    })
    .filter((item): item is string => Boolean(item));

  if (items.length === 0) return "";
  return [
    "CAPS sections available for direct grounding:",
    ...items,
    "Use these sections before general reasoning.",
    "Cite the source URL in plain text when referencing a specific rule or section.",
    "If no section matches, say the CAPS layer did not contain a verified match."
  ].join("\n");
}

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

export async function generateClarifyingQuestion(prompt: string, focusSubject?: string) {
  const fallback = focusSubject
    ? `Which part of ${focusSubject} do you want help with, and what grade are you in?`
    : "Which subject and topic do you want help with?";
  return runAiText("Ask one short clarifying question when the learner's prompt is too vague.", { prompt, focusSubject }, fallback);
}

export async function markLearnerAnswer(payload: {
  subject?: string;
  topic?: string;
  question?: string;
  learnerAnswer: string;
  grade?: number;
  grounding?: AiGroundingContext;
}) {
  const fallback: AnswerReview = {
    summary: "Your answer needs a bit more detail and clearer steps.",
    strengths: ["You attempted the question."],
    improvements: ["Show each working step clearly.", "Use the correct formula or rule before calculating."],
    likelyMarksLost: 2,
    nextStep: "Rewrite your answer in smaller steps and check whether each line follows from the previous one.",
    modelAnswer: undefined,
    confidence: "medium"
  };

  return runAiJson<AnswerReview>(
    "Mark a learner's answer using South African exam feedback. Return concise, structured feedback only.",
    payload,
    fallback
  );
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
  focusSubject?: string,
  coachMode: CoachMode = "chat"
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

  let contextPrefix = `${systemRules}${whatsappNote}\n\n${buildCoachInstructions(coachMode, focusSubject)}\n\n`;
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
  const capsGuidance = buildCapsGuidance(grounding?.capsSections);
  if (capsGuidance) {
    contextPrefix += `${capsGuidance}\n\n`;
  }
  const memoryGuidance = buildMemoryGuidance(grounding?.coachMemory);
  if (memoryGuidance) {
    contextPrefix += `${memoryGuidance}\n\n`;
  }
  contextPrefix += "If the learner asks for a plan, explanation, or practice, stay on that task and do not drift into unrelated advice.\n\n";

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
