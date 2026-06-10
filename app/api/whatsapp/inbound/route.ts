import { createHmac } from "crypto";
import { getServiceSupabase } from "@/lib/auth-server";
import { streamCoachResponse, type ConversationMessage } from "@/lib/ai";
import { loadCoachMemory, recordCoachMemory, summarizeCoachMemory } from "@/lib/coach-memory";
import { normalizeWhatsappPhone } from "@/lib/whatsapp-reminders";
import type { LearnerProfile } from "@/lib/types";

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_HISTORY_MESSAGES = 20; // 10 turns

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const from = params.From ?? "";
  const messageText = (params.Body ?? "").trim();

  if (!from || !messageText) {
    return twiml("Sorry, I couldn't read your message. Please try again.");
  }

  if (process.env.NODE_ENV === "production") {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) return new Response("Service not configured.", { status: 500 });
    const sig = request.headers.get("x-twilio-signature") ?? "";
    if (!isTwilioSignatureValid(authToken, webhookUrl(request), params, sig)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const phone = normalizeWhatsappPhone(from.replace(/^whatsapp:/i, ""));
  if (!phone) return twiml("Sorry, I couldn't identify your number. Please try again.");

  let supabase: ReturnType<typeof getServiceSupabase>;
  try {
    supabase = getServiceSupabase();
  } catch {
    return twiml("Service temporarily unavailable. Please try again later.");
  }

  const [learnerRow, sessionRow] = await Promise.all([
    loadLearnerByPhone(supabase, phone),
    loadSession(supabase, phone)
  ]);

  // Handle simple commands
  const lower = messageText.toLowerCase();

  if (lower === "help") {
    return twiml(helpText(Boolean(learnerRow)));
  }

  if (lower === "stop" || lower === "unsubscribe" || lower === "optout") {
    if (learnerRow) {
      await supabase.from("learner_profiles").update({ whatsapp_opt_in: false }).eq("id", learnerRow.id);
    }
    return twiml(
      "You've been unsubscribed from MatricSA reminders. You can still message me for coaching anytime. Reply 'start' to re-enable reminders."
    );
  }

  if (lower === "start" || lower === "subscribe") {
    if (learnerRow) {
      await supabase.from("learner_profiles").update({ whatsapp_opt_in: true }).eq("id", learnerRow.id);
    }
    return twiml("MatricSA reminders are now enabled. Ask me any CAPS question to get started.");
  }

  if (lower === "plan") {
    return twiml(await buildPlanSummary(learnerRow));
  }

  // Determine conversation history (reset if session is stale)
  const isStale = !sessionRow || Date.now() - new Date(sessionRow.updated_at).getTime() > SESSION_TTL_MS;
  const rawHistory = isStale ? [] : (sessionRow?.messages_json ?? []);
  const previousMessages: ConversationMessage[] = rawHistory
    .filter((m) => m.role === "user" || m.role === "assistant") as ConversationMessage[];

  const messages: ConversationMessage[] = [...previousMessages, { role: "user", content: messageText }];
  const profile = learnerRow ? mapToProfile(learnerRow) : null;
  const coachMemory = learnerRow ? await loadCoachMemory(supabase, learnerRow.id, 8).catch(() => []) : [];
  const grounding = coachMemory.length > 0 ? { coachMemory: summarizeCoachMemory(coachMemory) } : undefined;

  let aiResponse = "";
  try {
    for await (const chunk of streamCoachResponse(messages, profile, grounding, "whatsapp")) {
      aiResponse += chunk;
    }
  } catch {
    aiResponse = "Sorry, I'm having trouble right now. Please try again in a moment.";
  }

  if (!aiResponse) aiResponse = "I didn't generate a response. Please try rephrasing your question.";

  // Truncate to WhatsApp safe limit
  const reply =
    aiResponse.length > 1500 ? `${aiResponse.slice(0, 1450)}...\n\n_(Reply to continue)_` : aiResponse;

  // Persist session
  const updatedMessages: ConversationMessage[] = [
    ...messages,
    { role: "assistant" as const, content: aiResponse }
  ].slice(-MAX_HISTORY_MESSAGES);
  await upsertSession(supabase, phone, learnerRow?.id ?? null, updatedMessages);
  if (learnerRow) {
    await recordCoachMemory(supabase, learnerRow.id, {
      subjectName: inferCoachSubject(profile, messageText),
      topicLabel: messageText.slice(0, 120),
      mode: "chat",
      question: messageText,
      summary: aiResponse.slice(0, 280)
    }).catch(() => null);
  }

  return twiml(reply);
}

// ─── Plan summary ─────────────────────────────────────────────────────────────

type LearnerRow = {
  id: string;
  grade: 10 | 11 | 12;
  province: string;
  home_language: string;
  internet_access_level: "low" | "medium" | "high";
  career_interests: string[] | null;
  exam_date: string | null;
  learner_subjects: Array<{
    id: string;
    current_mark: number;
    target_mark: number;
    subjects: { id: string; name: string; grade: 10 | 11 | 12 } | null;
  }> | null;
};

async function buildPlanSummary(learnerRow: LearnerRow | null): Promise<string> {
  if (!learnerRow) {
    return "Set up your learner profile at matricsa.co.za/onboarding to get a personalised study plan.";
  }
  const profile = mapToProfile(learnerRow);
  const subjects = profile.subjects
    .sort((a, b) => (b.targetMark - b.currentMark) - (a.targetMark - a.currentMark))
    .slice(0, 5);
  const lines = ["*Your top 5 focus subjects:*", ""];
  for (const s of subjects) {
    const gap = s.targetMark - s.currentMark;
    lines.push(`- ${s.name}: ${s.currentMark}% (target ${s.targetMark}%, gap ${gap > 0 ? `+${gap}` : gap}%)`);
  }
  lines.push("", "Open MatricSA to generate your full 7-day plan: matricsa.co.za/study-coach");
  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isTwilioSignatureValid(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const data = url + Object.keys(params).sort().map((k) => k + (params[k] ?? "")).join("");
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  return expected === signature;
}

function webhookUrl(request: Request): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const base = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
    return `${base}/api/whatsapp/inbound`;
  }
  // Strip query params — Twilio signs without them
  const url = new URL(request.url);
  return `${url.origin}${url.pathname}`;
}

function helpText(hasProfile: boolean): string {
  const lines = [
    "*MatricSA Study Coach*",
    "",
    "Just type any CAPS question and I'll explain it.",
    "",
    "Commands:",
    "• *plan* — see your top focus subjects",
    "• *stop* — unsubscribe from reminders",
    "• *start* — re-enable reminders",
    "• *help* — show this message"
  ];
  if (!hasProfile) {
    lines.push("", "Register at matricsa.co.za to get personalised coaching.");
  }
  return lines.join("\n");
}

// ─── Database helpers ─────────────────────────────────────────────────────────

type SessionRow = {
  phone: string;
  learner_id: string | null;
  messages_json: ConversationMessage[];
  updated_at: string;
};

async function loadLearnerByPhone(
  supabase: ReturnType<typeof getServiceSupabase>,
  phone: string
): Promise<LearnerRow | null> {
  const { data } = await supabase
    .from("learner_profiles")
    .select(
      `id, grade, province, home_language, internet_access_level, career_interests, exam_date,
       learner_subjects ( id, current_mark, target_mark, subjects ( id, name, grade ) )`
    )
    .eq("whatsapp_phone", phone)
    .maybeSingle();
  return (data as LearnerRow | null) ?? null;
}

async function loadSession(
  supabase: ReturnType<typeof getServiceSupabase>,
  phone: string
): Promise<SessionRow | null> {
  const { data } = await supabase.from("whatsapp_sessions").select("*").eq("phone", phone).maybeSingle();
  return (data as SessionRow | null) ?? null;
}

async function upsertSession(
  supabase: ReturnType<typeof getServiceSupabase>,
  phone: string,
  learnerId: string | null,
  messages: ConversationMessage[]
): Promise<void> {
  await supabase
    .from("whatsapp_sessions")
    .upsert(
      { phone, learner_id: learnerId, messages_json: messages, updated_at: new Date().toISOString() },
      { onConflict: "phone" }
    );
}

function mapToProfile(row: LearnerRow): LearnerProfile {
  const subjects = (row.learner_subjects ?? [])
    .map((item) => {
      const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
      if (!subject) return null;
      return {
        id: item.id,
        subjectId: subject.id,
        name: subject.name,
        grade: subject.grade,
        currentMark: Number(item.current_mark),
        targetMark: Number(item.target_mark)
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    id: row.id,
    grade: row.grade,
    province: row.province,
    homeLanguage: row.home_language,
    internetAccessLevel: row.internet_access_level,
    careerInterests: row.career_interests ?? [],
    preferredStudyTimes: [],
    examDate: row.exam_date ?? "",
    subjects
  };
}

function inferCoachSubject(profile: LearnerProfile | null, messageText: string) {
  if (!profile) return "General";
  const lower = messageText.toLowerCase();
  const match = profile.subjects.find((subject) => lower.includes(subject.name.toLowerCase()));
  return match?.name ?? profile.subjects[0]?.name ?? "General";
}
