"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CalendarPlus, RefreshCw, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { loadApsRules, loadBursaries, loadPastPaperQuestions } from "@/lib/content-data";
import { sampleApsRules, sampleBursaries, sampleQuestions } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { saveStudyPlan } from "@/lib/study-plan-data";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import type { ApsRule, Bursary, PastPaperQuestion, StudyTask } from "@/lib/types";
import type { ConversationMessage } from "@/lib/ai";
import { friendlyError } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  plan?: StudyTask[];
  isLocal?: boolean; // locally-generated — excluded from Gemini history
};

const WELCOME_ID = "welcome";

const QUICK_PROMPTS = [
  "Explain this concept simply with a worked example.",
  "Give me a practice question on this topic.",
  "What are common mistakes learners make here?",
  "How does this come up in NSC exams?"
];

export default function StudyCoachPage() {
  const { profile, isDemo } = useLearnerProfile();
  const [apsRules, setApsRules] = useState<ApsRule[]>(sampleApsRules);
  const [bursaries, setBursaries] = useState<Bursary[]>(sampleBursaries);
  const [questions, setQuestions] = useState<PastPaperQuestion[]>(sampleQuestions);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: WELCOME_ID,
      role: "assistant",
      content:
        "Hi! I'm your MatricSA study coach. Ask me any CAPS question — I can explain concepts, create practice questions, or help you prepare for exams. What would you like to work on today?",
      isLocal: true
    }
  ]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const grounding = {
    apsRules: apsRules.map((r) => ({ institutionName: r.institutionName, programmeName: r.programmeName, sourceUrl: r.sourceUrl })),
    bursaries: bursaries.map((b) => ({ name: b.name, fieldOfStudy: b.fieldOfStudy, deadline: b.deadline, sourceUrl: b.sourceUrl })),
    pastPaperQuestions: questions.map((q) => ({ subject: q.subject, topic: q.topic, year: q.year, sourceUrl: q.sourceUrl }))
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([loadApsRules(supabase), loadBursaries(supabase), loadPastPaperQuestions(supabase)]).then(
      ([rules, loadedBursaries, loadedQuestions]) => {
        setApsRules(rules);
        setBursaries(loadedBursaries);
        setQuestions(loadedQuestions);
      }
    );
  }, []);

  useEffect(() => {
    if (profile.subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(profile.subjects[0].name);
    }
  }, [profile.subjects, selectedSubject]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cancel any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || isStreaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };

    // Fix 2: exclude local/streaming messages. Fix 4: cap to last 12. Fix 7: include plan summary.
    const history: ConversationMessage[] = [
      ...messages
        .filter((m) => !m.isLocal && !m.streaming && m.content.trim())
        .slice(-12)
        .map(({ role, content: c, plan }) => ({
          role: role as ConversationMessage["role"],
          content: plan
            ? `${c}\n${plan.map((t) => `${t.day}: ${t.subject} — ${t.topic} (${t.durationMinutes} min)`).join("\n")}`
            : c
        })),
      { role: "user" as const, content }
    ];

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    // Fix 1: abort previous + register new controller
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        // Fix 5: pass selectedSubject. Fix 6: no grounding on stream requests.
        body: JSON.stringify({
          type: "stream",
          messages: history,
          profile: isDemo ? null : profile,
          focusSubject: selectedSubject || undefined
        })
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snapshot = accumulated;
        setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: snapshot } : m)));
      }

      setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, streaming: false } : m)));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return; // clean unmount
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: friendlyError(error, "Could not reach the coach. Please try again."), streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function generatePlan() {
    if (isStreaming) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: "Generate my 7-day study plan." };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Generating your 7-day study plan...",
      streaming: true
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plan", profile, grounding })
      });
      const data = await res.json();
      const tasks = normalisePlan(data.result, profile);
      const supabase = getSupabaseBrowserClient();
      if (supabase && !isDemo) await saveStudyPlan(supabase, profile, tasks);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: "Here's your 7-day study plan:", plan: tasks, streaming: false } : m
        )
      );
    } catch (error) {
      const fallback = generateLocalStudyPlan(profile);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: friendlyError(error, "Generated a local fallback plan:"), plan: fallback, streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  function startNewConversation() {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "New conversation started. What would you like to work on?",
        isLocal: true
      }
    ]);
  }

  return (
    <AppShell>
      <PageHeader title="AI Study Coach" eyebrow="CAPS-aligned">
        Ask any CAPS question. The coach explains concepts, creates practice questions, and builds study plans. Always verify official facts on source pages.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot className="text-veld" size={20} />
              <h2 className="text-xl font-black">Study Coach</h2>
              <Badge tone={isDemo ? "sample" : "safe"}>{isDemo ? "Demo" : `Grade ${profile.grade}`}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {profile.subjects.length > 0 && (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="focus-ring rounded-lg border border-ink/15 px-2 py-1.5 text-xs font-bold"
                >
                  {profile.subjects.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={startNewConversation}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-2 py-1.5 text-xs font-bold"
              >
                <RefreshCw size={12} /> New
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-96 max-h-[520px] flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-4 flex items-end gap-2 border-t border-ink/10 pt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={`Ask about ${selectedSubject || "any CAPS topic"}… (Enter to send, Shift+Enter for new line)`}
              className="focus-ring min-h-12 flex-1 resize-none rounded-lg border border-ink/15 p-3 text-sm disabled:opacity-60"
              rows={2}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
              className="focus-ring flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-veld text-white disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-black">Your subjects</h2>
            <div className="mt-3 space-y-1.5">
              {profile.subjects.slice(0, 7).map((subject) => (
                <button
                  key={subject.name}
                  onClick={() => {
                    setSelectedSubject(subject.name);
                    setInput(`Explain the most important Grade ${profile.grade} CAPS concepts for ${subject.name}.`);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-ink/10 px-3 py-2 text-left text-sm hover:bg-chalk"
                >
                  <span className="font-bold">{subject.name}</span>
                  <span
                    className={`text-xs font-bold ${
                      subject.currentMark < 40 ? "text-protea" : subject.currentMark < 55 ? "text-amber-600" : "text-veld"
                    }`}
                  >
                    {subject.currentMark}%
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Quick prompts</h2>
            <div className="mt-3 space-y-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(selectedSubject ? `${prompt} (${selectedSubject})` : prompt)}
                  className="w-full rounded-lg border border-ink/10 px-3 py-2 text-left text-xs font-semibold text-ink/70 hover:bg-chalk hover:text-ink"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Study plan</h2>
            <p className="mt-1 text-sm text-ink/65">Generate a personalised 7-day plan based on your subjects and marks.</p>
            <button
              onClick={generatePlan}
              disabled={isStreaming}
              className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-black disabled:opacity-60"
            >
              <CalendarPlus size={16} /> Generate 7-day plan
            </button>
          </Card>

          <div className="rounded-lg border border-protea/20 bg-protea/10 p-3 text-xs leading-5 text-ink/70">
            MatricSA uses stored reference data only. Official paper content, admission requirements, and bursary deadlines must be verified on the original source pages before any application or exam decision.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-veld px-4 py-3 text-sm text-white">{msg.content}</div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-white">
        <Bot size={14} />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-ink/10 bg-white px-4 py-3">
        {msg.streaming && !msg.content ? (
          <p className="animate-pulse text-sm text-ink/50">Thinking…</p>
        ) : msg.plan ? (
          <PlanView content={msg.content} tasks={msg.plan} />
        ) : (
          <>
            <Markdown content={msg.content} />
            {msg.streaming ? <span className="animate-pulse font-mono text-veld">▌</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

function PlanView({ content, tasks }: { content: string; tasks: StudyTask[] }) {
  return (
    <>
      <p className="text-sm font-bold">{content}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {tasks.map((task, i) => (
          <div key={i} className="rounded-lg border border-ink/10 p-2.5">
            <p className="text-xs font-black text-veld">{task.day}</p>
            <p className="mt-1 text-xs font-bold">{task.subject.split(" ")[0]}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-ink/60">{task.topic}</p>
            <p className="mt-1.5 text-[11px] font-bold text-sky">{task.durationMinutes} min</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Markdown({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const segments = content.split(/(```[\s\S]*?```)/g);

  segments.forEach((segment, si) => {
    if (segment.startsWith("```")) {
      const code = segment.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
      parts.push(
        <pre key={`cb-${si}`} className="my-2 overflow-x-auto rounded-lg bg-ink p-3 text-[11px] leading-5 text-white">
          <code>{code}</code>
        </pre>
      );
      return;
    }

    const lines = segment.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const key = `${si}-${i}`;

      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const cls =
          level === 1 ? "mt-4 text-base font-black" : level === 2 ? "mt-3 text-sm font-black" : "mt-2 text-sm font-bold";
        parts.push(<p key={key} className={cls}>{inlineFormat(headingMatch[2])}</p>);
        i++;
        continue;
      }

      if (/^[-*]\s/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s/.test(lines[i])) {
          items.push(lines[i].slice(2));
          i++;
        }
        parts.push(
          <ul key={`${si}-${i}-ul`} className="mt-2 space-y-1 pl-4">
            {items.map((item, j) => (
              <li key={j} className="list-disc text-sm leading-6">
                {inlineFormat(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s+/, ""));
          i++;
        }
        parts.push(
          <ol key={`${si}-${i}-ol`} className="mt-2 space-y-1 pl-4">
            {items.map((item, j) => (
              <li key={j} className="list-decimal text-sm leading-6">
                {inlineFormat(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      if (!line.trim()) {
        i++;
        continue;
      }

      if (/^---+$/.test(line.trim())) {
        parts.push(<hr key={key} className="my-2 border-ink/10" />);
        i++;
        continue;
      }

      parts.push(
        <p key={key} className="mt-1.5 text-sm leading-6 first:mt-0">
          {inlineFormat(line)}
        </p>
      );
      i++;
    }
  });

  return <div className="overflow-hidden">{parts}</div>;
}

function inlineFormat(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={i} className="rounded bg-ink/10 px-1 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    return part as React.ReactNode;
  });
}

function normalisePlan(result: unknown, profile: ReturnType<typeof useLearnerProfile>["profile"]): StudyTask[] {
  if (Array.isArray(result)) return result as StudyTask[];
  if (result && typeof result === "object" && Array.isArray((result as { tasks?: unknown[] }).tasks)) {
    return (result as { tasks: StudyTask[] }).tasks;
  }
  return generateLocalStudyPlan(profile);
}
