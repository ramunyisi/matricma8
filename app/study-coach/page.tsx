"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CalendarPlus, CheckCircle2, Flame, RefreshCw, Send, Sparkles, Target, BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { loadApsRules, loadBursaries, loadCapsContent, loadCapsSections, loadPastPaperQuestions } from "@/lib/content-data";
import { loadCoachMemory, recordCoachMemory, sortCoachMemory, summarizeCoachMemory } from "@/lib/coach-memory";
import { summarizeCapsContentForPrompt, getCapsSectionsForCoach } from "@/lib/caps-content";
import { sampleApsRules, sampleBursaries, sampleQuestions } from "@/lib/sample-data";
import { getAuthHeaders, getSupabaseBrowserClient } from "@/lib/supabase";
import { saveStudyPlan } from "@/lib/study-plan-data";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import type { ApsRule, Bursary, CapsContentSection, CoachTopicMemory, PastPaperQuestion, StudyTask } from "@/lib/types";
import type { AnswerReview, CoachMode, ConversationMessage } from "@/lib/ai";
import { friendlyError } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  plan?: StudyTask[];
  review?: AnswerReview;
  isLocal?: boolean; // locally-generated — excluded from Gemini history
  coachSubjectName?: string;
  topicLabel?: string;
  coachMode?: CoachMode;
  feedback?: "helpful" | "needs_work";
  sourceTags?: string[];
};

const WELCOME_ID = "welcome";

const QUICK_PROMPTS = [
  "Explain this concept simply with a worked example.",
  "Give me a practice question on this topic.",
  "What are common mistakes learners make here?",
  "How does this come up in NSC exams?"
];

const COACH_MODES: { mode: CoachMode; label: string; icon: typeof Sparkles }[] = [
  { mode: "chat", label: "Chat", icon: Sparkles },
  { mode: "explain", label: "Explain", icon: BookOpen },
  { mode: "practice", label: "Practice", icon: Target },
  { mode: "revise", label: "Revise", icon: Flame },
  { mode: "testMe", label: "Test me", icon: CheckCircle2 }
];

type CoachPane = "progress" | "sources" | "history";

type QuickActionContext = {
  coachMode: CoachMode;
  selectedSubject: string;
  setCoachMode: (mode: CoachMode) => void;
  setSelectedSubject: (subject: string) => void;
  setInput: (value: string) => void;
  openSubjectPicker: () => void;
  profile: ReturnType<typeof useLearnerProfile>["profile"];
};

const QUICK_ACTIONS: { label: string; onClick: (context: QuickActionContext) => void }[] = [
  {
    label: "Explain simpler",
    onClick: ({ selectedSubject, setCoachMode, setInput }) => {
      setCoachMode("explain");
      setInput(`Explain ${selectedSubject || "this topic"} more simply with one worked example.`);
    }
  },
  {
    label: "Give another question",
    onClick: ({ setCoachMode, selectedSubject, setInput }) => {
      setCoachMode("practice");
      setInput(`Give me one more CAPS practice question on ${selectedSubject || "this topic"}.`);
    }
  },
  {
    label: "Mark my answer",
    onClick: ({ setCoachMode, selectedSubject, setInput }) => {
      setCoachMode("markAnswer");
      setInput(selectedSubject || "Mark my answer");
    }
  },
  {
    label: "Switch subject",
    onClick: ({ openSubjectPicker }) => {
      openSubjectPicker();
    }
  }
];

export default function StudyCoachPage() {
  const { profile, isDemo, isLoading } = useLearnerProfile();
  const [apsRules, setApsRules] = useState<ApsRule[]>(sampleApsRules);
  const [bursaries, setBursaries] = useState<Bursary[]>(sampleBursaries);
  const [questions, setQuestions] = useState<PastPaperQuestion[]>(sampleQuestions);
  const [capsContent, setCapsContent] = useState<Awaited<ReturnType<typeof loadCapsContent>>>([]);
  const [capsSections, setCapsSections] = useState<CapsContentSection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: WELCOME_ID,
      role: "assistant",
      content:
        "Hi. Choose a subject and a mode, then ask one CAPS topic at a time. I can explain, test, revise, or mark your answer. If you are not sure where to start, use the weak-area panel on the right.",
      isLocal: true
    }
  ]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectLoaded, setSubjectLoaded] = useState(false);
  const [coachMode, setCoachMode] = useState<CoachMode>("chat");
  const [answerDraft, setAnswerDraft] = useState("");
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [coachMemory, setCoachMemory] = useState<CoachTopicMemory[]>([]);
  const [activePane, setActivePane] = useState<CoachPane>("progress");
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const queryAppliedRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeSubject = selectedSubject || profile.subjects[0]?.name || "General";

  const grounding = {
    apsRules: apsRules.map((r) => ({ institutionName: r.institutionName, programmeName: r.programmeName, sourceUrl: r.sourceUrl })),
    bursaries: bursaries.map((b) => ({ name: b.name, fieldOfStudy: b.fieldOfStudy, deadline: b.deadline, sourceUrl: b.sourceUrl })),
    pastPaperQuestions: questions.map((q) => ({ subject: q.subject, topic: q.topic, year: q.year, sourceUrl: q.sourceUrl })),
    capsContent: summarizeCapsContentForPrompt(activeSubject, profile.grade),
    capsSections: capsSections.length > 0
      ? capsSections
          .filter((section) => {
            const sectionSubject = section.subject.toLowerCase();
            const chosenSubject = activeSubject.toLowerCase();
            return !chosenSubject || sectionSubject === "all subjects" || sectionSubject.includes(chosenSubject.toLowerCase()) || chosenSubject.includes(sectionSubject);
          })
          .slice(0, 5)
      : getCapsSectionsForCoach(activeSubject, profile.grade, input || undefined),
    coachMemory: summarizeCoachMemory(coachMemory)
  };
  const coachStats = {
    trackedTopics: coachMemory.length,
    totalSessions: coachMemory.reduce((sum, item) => sum + item.sessionCount, 0),
    repeatedWeakTopics: coachMemory.filter((item) => item.struggleCount >= 3).length,
    topWeakTopic: sortCoachMemory(coachMemory)[0]
  };
  const sourceSummary = buildSourceSummary(grounding);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([loadApsRules(supabase), loadBursaries(supabase), loadPastPaperQuestions(supabase), loadCapsContent(), loadCapsSections()]).then(
      ([rules, loadedBursaries, loadedQuestions, loadedCaps, loadedSections]) => {
        setApsRules(rules);
        setBursaries(loadedBursaries);
        setQuestions(loadedQuestions);
        setCapsContent(loadedCaps);
        setCapsSections(loadedSections);
      }
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMemory() {
      if (isDemo || !profile.id) {
        setCoachMemory([]);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      try {
        const memory = await loadCoachMemory(supabase, profile.id, 8);
        if (isMounted) {
          setCoachMemory(sortCoachMemory(memory));
        }
      } catch {
        if (isMounted) setCoachMemory([]);
      }
    }

    void loadMemory();

    return () => {
      isMounted = false;
    };
  }, [isDemo, profile.id]);

  useEffect(() => {
    if (subjectLoaded) return;
    if (isLoading) return;

    if (profile.subjects.length === 0) {
      setSubjectLoaded(true);
      return;
    }

    try {
      const saved = localStorage.getItem("matricsa-study-coach-subject");
      const validSaved = saved && profile.subjects.some((subject) => subject.name === saved);
      setSelectedSubject(validSaved ? saved : profile.subjects[0].name);
    } catch {
      setSelectedSubject(profile.subjects[0].name);
    } finally {
      setSubjectLoaded(true);
    }
  }, [isLoading, profile.subjects, subjectLoaded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("matricsa-study-coach-topics");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentTopics(parsed.filter((item): item is string => typeof item === "string").slice(0, 5));
        }
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("matricsa-study-coach-topics", JSON.stringify(recentTopics.slice(0, 5)));
    } catch {
      // Ignore storage failures.
    }
  }, [recentTopics]);

  useEffect(() => {
    if (!subjectLoaded || !selectedSubject) return;
    try {
      localStorage.setItem("matricsa-study-coach-subject", selectedSubject);
    } catch {
      // Ignore storage failures.
    }
  }, [selectedSubject, subjectLoaded]);

  useEffect(() => {
    if (!subjectLoaded || queryAppliedRef.current) return;
    if (profile.subjects.length === 0) return;

    const searchParams = new URLSearchParams(window.location.search);
    const subjectParam = searchParams.get("subject")?.trim() ?? "";
    const topicParam = searchParams.get("topic")?.trim() ?? "";
    const modeParam = searchParams.get("mode")?.trim() ?? "";
    const validSubject = profile.subjects.some((subject) => subject.name === subjectParam) ? subjectParam : "";
    const validMode = ["chat", "explain", "practice", "revise", "testMe", "markAnswer"].includes(modeParam)
      ? (modeParam as CoachMode)
      : null;

    if (validSubject) setSelectedSubject(validSubject);
    if (validMode) setCoachMode(validMode);
    if (topicParam) {
      setInput(topicParam);
      setRecentTopics((prev) => [topicParam, ...prev.filter((item) => item !== topicParam)].slice(0, 5));
    }

    if (validSubject || topicParam || validMode) {
      queryAppliedRef.current = true;
      setShowSubjectPicker(false);
    }
  }, [profile.subjects, selectedSubject, subjectLoaded]);

  // Cancel any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  async function persistCoachMemoryEntry(payload: {
    subjectName: string;
    topicLabel: string;
    mode: CoachMode;
    question?: string;
    answer?: string;
    summary?: string;
    review?: AnswerReview | null;
    feedback?: "helpful" | "needs_work";
  }) {
    if (isDemo || !profile.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      await recordCoachMemory(supabase, profile.id, payload);
      const memory = await loadCoachMemory(supabase, profile.id, 8);
      setCoachMemory(sortCoachMemory(memory));
    } catch {
      // Ignore persistence failures; the coach still works.
    }
  }

  async function rateResponse(message: ChatMessage, feedback: "helpful" | "needs_work") {
    if (!message.coachSubjectName || !message.topicLabel) return;
    setMessages((prev) =>
      prev.map((item) => (item.id === message.id ? { ...item, feedback } : item))
    );
    await persistCoachMemoryEntry({
      subjectName: message.coachSubjectName,
      topicLabel: message.topicLabel,
      mode: message.coachMode ?? "chat",
      summary: message.content.slice(0, 280),
      feedback
    });
  }

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || isStreaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      streaming: true,
      sourceTags: deriveSourceTags(grounding)
    };

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
    setRecentTopics((prev) => [content, ...prev.filter((item) => item !== content)].slice(0, 5));
    setInput("");
    setIsStreaming(true);

    // Fix 1: abort previous + register new controller
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        signal: controller.signal,
        body: JSON.stringify({
          type: "stream",
          messages: history,
          focusSubject: selectedSubject || undefined,
          coachMode
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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                streaming: false,
                coachSubjectName: activeSubject,
                topicLabel: `${selectedSubject ? `${selectedSubject}: ` : ""}${content}`,
                coachMode
              }
            : m
        )
      );
      await persistCoachMemoryEntry({
        subjectName: activeSubject,
        topicLabel: `${selectedSubject ? `${selectedSubject}: ` : ""}${content}`,
        mode: coachMode,
        question: content,
        summary: accumulated.slice(0, 280)
      });
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
    const recentLabel = "7-day study plan";
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: "Generate my 7-day study plan." };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Generating your 7-day study plan...",
      streaming: true,
      sourceTags: deriveSourceTags(grounding)
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setRecentTopics((prev) => [recentLabel, ...prev.filter((item) => item !== recentLabel)].slice(0, 5));
    setIsStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ type: "plan", grounding })
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

  async function reviewAnswer() {
    if (isStreaming || !answerDraft.trim()) return;
    const recentLabel = input.trim() || selectedSubject || "Marked answer";

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: `Please mark my answer for ${selectedSubject || "this subject"}${input.trim() ? ` on: ${input.trim()}` : "."}`
    };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Marking your answer...",
      streaming: true,
      sourceTags: deriveSourceTags(grounding)
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setRecentTopics((prev) => [recentLabel, ...prev.filter((item) => item !== recentLabel)].slice(0, 5));
    setIsStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({
          type: "markAnswer",
          subject: selectedSubject || undefined,
          topic: input.trim() || undefined,
          question: input.trim() || undefined,
          learnerAnswer: answerDraft,
          grade: profile.grade,
          grounding
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      const review = normaliseReview(data.result);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: review.summary,
                review,
                streaming: false,
                coachSubjectName: activeSubject,
                topicLabel: `${selectedSubject ? `${selectedSubject}: ` : ""}${recentLabel}`,
                coachMode: "markAnswer"
              }
            : m
        )
      );
      await persistCoachMemoryEntry({
        subjectName: activeSubject,
        topicLabel: `${selectedSubject ? `${selectedSubject}: ` : ""}${recentLabel}`,
        mode: "markAnswer",
        question: input.trim() || recentLabel,
        answer: answerDraft,
        summary: review.summary,
        review
      });
      setAnswerDraft("");
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: friendlyError(error, "Could not mark the answer right now."), streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleMessageAction(message: ChatMessage, action: "continue" | "simpler" | "practice" | "mark" | "switch") {
    const topic = message.topicLabel || message.content.slice(0, 120);
    if (action === "continue") {
      setCoachMode(message.coachMode ?? "chat");
      setInput(`Continue with ${topic}.`);
      return;
    }
    if (action === "simpler") {
      setCoachMode("explain");
      setInput(`Explain ${topic} more simply with one worked example.`);
      return;
    }
    if (action === "practice") {
      setCoachMode("practice");
      setInput(`Give me one more CAPS practice question on ${topic}.`);
      return;
    }
    if (action === "mark") {
      setCoachMode("markAnswer");
      setInput(topic);
      return;
    }
    setShowSubjectPicker(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (coachMode !== "markAnswer") {
        sendMessage(input);
      }
    }
  }

  function startNewConversation() {
    abortRef.current?.abort();
    setIsStreaming(false);
    setCoachMode("chat");
    setAnswerDraft("");
    setInput("");
    setShowSubjectPicker(false);
    queryAppliedRef.current = false;
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "New conversation started. Choose a subject and a mode, then ask the next CAPS topic.",
        isLocal: true
      }
    ]);
  }

  return (
    <AppShell>
      <PageHeader title="AI Study Coach" eyebrow="CAPS-aligned">
        Ask any CAPS question. The coach explains concepts, creates practice questions, and builds study plans. Always verify official facts on source pages.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="flex min-h-[78vh] flex-col overflow-hidden p-0">
          <div className="sticky top-0 z-20 border-b border-ink/10 bg-chalk/95 px-5 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="text-veld" size={20} />
                <h2 className="text-xl font-black">Study Coach</h2>
                <Badge tone={isDemo ? "sample" : "safe"}>{isDemo ? "Demo" : `Grade ${profile.grade}`}</Badge>
                <Badge tone="neutral">{activeSubject}</Badge>
              </div>
              <button
                onClick={startNewConversation}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-2 py-1.5 text-xs font-bold"
              >
                <RefreshCw size={12} /> New
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-wrap gap-2">
                {profile.subjects.length > 0 && (
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="focus-ring min-w-0 rounded-lg border border-ink/15 px-2 py-1.5 text-xs font-bold"
                  >
                    {profile.subjects.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <Badge tone="sample">Mode: {coachMode}</Badge>
                <Badge tone="neutral">Focus: {activeSubject}</Badge>
                {sourceSummary ? <Badge tone="watch">{sourceSummary}</Badge> : null}
              </div>
            </div>

            {showSubjectPicker && profile.subjects.length > 0 ? (
              <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-widest text-ink/45">Pick a subject</p>
                  <button
                    onClick={() => setShowSubjectPicker(false)}
                    className="focus-ring rounded-full border border-ink/10 px-2.5 py-1 text-xs font-bold text-ink/60 hover:bg-chalk"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {profile.subjects.map((subject) => {
                    const active = subject.name === selectedSubject;
                    return (
                      <button
                        key={subject.name}
                        onClick={() => {
                          setSelectedSubject(subject.name);
                          setInput(`Help me with ${subject.name} at Grade ${profile.grade} CAPS level.`);
                          setShowSubjectPicker(false);
                        }}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                          active ? "border-veld bg-veld/5" : "border-ink/10 bg-chalk hover:bg-white"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold">{subject.name}</p>
                          <p className="text-[11px] text-ink/55">Mark {subject.currentMark}% • target {subject.targetMark}%</p>
                        </div>
                        {active ? <Badge tone="safe">Active</Badge> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {COACH_MODES.map((option) => {
                const active = coachMode === option.mode;
                const Icon = option.icon;
                return (
                  <button
                    key={option.mode}
                    onClick={() => setCoachMode(option.mode)}
                    className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                      active ? "border-veld bg-veld text-white" : "border-ink/10 bg-white text-ink/70 hover:bg-chalk"
                    }`}
                  >
                    <Icon size={12} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink/55">
              {coachMode === "chat" && "Ask naturally. The coach will explain, practise, or revise based on your prompt."}
              {coachMode === "explain" && "Best for concepts, definitions, and worked examples."}
              {coachMode === "practice" && "Best for exam-style questions and step-by-step solutions."}
              {coachMode === "revise" && "Best for summaries, formulas, and common mistakes."}
              {coachMode === "testMe" && "The coach will ask one question and wait for your attempt."}
            </p>
            <p className="mt-2 text-xs font-semibold text-ink/55">
              {activeSubject} → {coachMode}
            </p>
          </div>

          {messages.length === 1 ? (
            <div className="border-y border-ink/10 bg-white px-5 py-4">
              <p className="text-xs font-black uppercase tracking-widest text-ink/45">Quick start</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  onClick={() => {
                    setCoachMode("explain");
                    setInput(`Explain the most important Grade ${profile.grade} CAPS concepts for ${activeSubject}.`);
                  }}
                  className="rounded-xl border border-ink/10 bg-chalk p-3 text-left hover:bg-white"
                >
                  <p className="text-sm font-black">Explain this subject</p>
                  <p className="mt-1 text-xs text-ink/60">Get a simple CAPS overview with an example.</p>
                </button>
                <button
                  onClick={() => {
                    setCoachMode("practice");
                    setInput(`Give me one CAPS practice question on ${activeSubject}.`);
                  }}
                  className="rounded-xl border border-ink/10 bg-chalk p-3 text-left hover:bg-white"
                >
                  <p className="text-sm font-black">Practice now</p>
                  <p className="mt-1 text-xs text-ink/60">Try an exam-style question and check your steps.</p>
                </button>
                <button
                  onClick={() => {
                    setCoachMode("revise");
                    setInput(`Revise the most important Grade ${profile.grade} CAPS topics for ${activeSubject}.`);
                  }}
                  className="rounded-xl border border-ink/10 bg-chalk p-3 text-left hover:bg-white"
                >
                  <p className="text-sm font-black">Revise weak areas</p>
                  <p className="mt-1 text-xs text-ink/60">Focus on the topics you need to fix first.</p>
                </button>
                <button
                  onClick={() => {
                    setCoachMode("markAnswer");
                    setInput(activeSubject);
                  }}
                  className="rounded-xl border border-ink/10 bg-chalk p-3 text-left hover:bg-white"
                >
                  <p className="text-sm font-black">Mark my answer</p>
                  <p className="mt-1 text-xs text-ink/60">Paste your answer and get marking feedback.</p>
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onRate={rateResponse} onAction={handleMessageAction} />
            ))}
            <div ref={endRef} />
          </div>

          <div className="sticky bottom-0 border-t border-ink/10 bg-white/95 px-5 py-4 backdrop-blur">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={
                  coachMode === "markAnswer"
                    ? `Type the question or topic you want marked for ${activeSubject}…`
                    : `Ask about ${activeSubject}… (Enter to send, Shift+Enter for new line)`
                }
                className="focus-ring min-h-12 flex-1 resize-none rounded-lg border border-ink/15 p-3 text-sm disabled:opacity-60"
                rows={2}
              />
              <button
                onClick={() => (coachMode === "markAnswer" ? reviewAnswer() : sendMessage(input))}
                disabled={isStreaming || (coachMode === "markAnswer" ? !answerDraft.trim() : !input.trim())}
                className="focus-ring flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-veld text-white disabled:opacity-60"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() =>
                    action.onClick({
                      coachMode,
                      selectedSubject,
                      setCoachMode,
                      setSelectedSubject,
                      setInput,
                      openSubjectPicker: () => setShowSubjectPicker(true),
                      profile
                    })
                  }
                  className="focus-ring rounded-full border border-ink/10 bg-white px-3 py-1.5 font-semibold text-ink/70 hover:bg-chalk"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex gap-2 lg:hidden">
            {[
              { id: "progress" as const, label: "Progress" },
              { id: "history" as const, label: "History" },
              { id: "sources" as const, label: "Sources" }
            ].map((tab) => {
              const active = activePane === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePane(tab.id)}
                  className={`focus-ring flex-1 rounded-lg px-3 py-2 text-xs font-black ${
                    active ? "bg-veld text-white" : "border border-ink/10 bg-white text-ink/70"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Card className={`${activePane !== "progress" ? "hidden lg:block" : ""}`}>
            <h2 className="text-lg font-black">Progress</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-ink/10 bg-chalk p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">Topics</p>
                <p className="mt-1 text-2xl font-black">{coachStats.trackedTopics}</p>
              </div>
              <div className="rounded-lg border border-ink/10 bg-chalk p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">Sessions</p>
                <p className="mt-1 text-2xl font-black">{coachStats.totalSessions}</p>
              </div>
              <div className="rounded-lg border border-ink/10 bg-chalk p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">Weak areas</p>
                <p className="mt-1 text-2xl font-black">{coachStats.repeatedWeakTopics}</p>
              </div>
            </div>
            {coachStats.topWeakTopic ? (
              <div className="mt-3 rounded-lg border border-protea/15 bg-protea/10 p-3">
                <p className="text-xs font-black uppercase tracking-widest text-protea">Start here</p>
                <p className="mt-1 text-sm font-bold text-ink">{coachStats.topWeakTopic.topicLabel}</p>
                <p className="mt-1 text-xs text-ink/65">
                  {coachStats.topWeakTopic.subjectName} • {coachStats.topWeakTopic.struggleCount} struggle points • last {coachStats.topWeakTopic.lastMode}
                </p>
                <p className="mt-2 text-xs text-ink/60">
                  The coach will prioritise this area when you ask for revision or practice on that subject.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubject(coachStats.topWeakTopic?.subjectName || activeSubject);
                      setCoachMode("revise");
                      setInput(`Revise ${coachStats.topWeakTopic?.topicLabel || "this topic"} for ${coachStats.topWeakTopic?.subjectName || activeSubject}.`);
                      setActivePane("progress");
                    }}
                    className="focus-ring rounded-full bg-veld px-3 py-1.5 text-xs font-black text-white"
                  >
                    Review weak topic
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSubject(coachStats.topWeakTopic?.subjectName || activeSubject);
                      setCoachMode("practice");
                      setInput(`Give me one CAPS practice question on ${coachStats.topWeakTopic?.topicLabel || "this topic"}.`);
                      setActivePane("progress");
                    }}
                    className="focus-ring rounded-full border border-ink/10 px-3 py-1.5 text-xs font-black text-ink/70 hover:bg-white"
                  >
                    Practice it
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink/45">No stored history yet. Use the coach a few times to build progress data.</p>
            )}
          </Card>

          <Card className={`${activePane !== "history" ? "hidden lg:block" : ""}`}>
            <h2 className="text-lg font-black">Recent topics</h2>
            <p className="mt-1 text-sm text-ink/65">Reuse what you were working on without typing it again.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recentTopics.length > 0 ? (
                recentTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setInput(topic)}
                    className="focus-ring rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-chalk"
                  >
                    {topic.length > 36 ? `${topic.slice(0, 36)}…` : topic}
                  </button>
                ))
              ) : (
                <p className="text-xs text-ink/45">No recent topics yet.</p>
              )}
            </div>
          </Card>

          {coachMode === "markAnswer" ? (
            <Card className={`${activePane !== "progress" ? "hidden lg:block" : ""}`}>
              <h2 className="text-lg font-black">Mark my answer</h2>
              <p className="mt-1 text-sm text-ink/65">
                Put the question or topic in the main box, paste your answer here, then ask the coach to mark it.
              </p>
              <textarea
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                placeholder="Paste your answer here..."
                className="focus-ring mt-3 min-h-36 w-full resize-y rounded-lg border border-ink/15 p-3 text-sm"
              />
              <button
                onClick={reviewAnswer}
                disabled={isStreaming || !answerDraft.trim()}
                className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-veld px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
              >
                <CheckCircle2 size={16} /> Review answer
              </button>
            </Card>
          ) : null}

          <Card className={`${activePane !== "history" ? "hidden lg:block" : ""}`}>
            <h2 className="text-lg font-black">Weak areas</h2>
            <p className="mt-1 text-sm text-ink/65">The coach keeps a running list of repeated topics that need revision.</p>
            <div className="mt-3 space-y-2">
              {coachMemory.length > 0 ? (
                coachMemory.slice(0, 5).map((item) => {
                  const weaknessScore = item.struggleCount * 2 - item.successCount;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedSubject(item.subjectName);
                        setInput(item.topicLabel);
                        setActivePane("progress");
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-ink/10 px-3 py-2 text-left hover:bg-chalk"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.topicLabel}</p>
                        <p className="text-[11px] text-ink/55">
                          {item.subjectName} • {item.sessionCount} session{item.sessionCount === 1 ? "" : "s"} • last {item.lastMode}
                        </p>
                      </div>
                      <Badge tone={weaknessScore >= 4 ? "risk" : weaknessScore >= 2 ? "watch" : "safe"}>
                        {weaknessScore >= 4 ? "Weak" : weaknessScore >= 2 ? "Review" : "Warm"}
                      </Badge>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-ink/45">No persistent weak areas yet. Use the coach a few times and they will appear here.</p>
              )}
            </div>
          </Card>

          <Card className={`${activePane !== "sources" ? "hidden lg:block" : ""}`}>
            <h2 className="text-lg font-black">Your subjects</h2>
            <div className="mt-3 space-y-1.5">
              {profile.subjects.slice(0, 7).map((subject) => (
                <button
                  key={subject.name}
                  onClick={() => {
                    setSelectedSubject(subject.name);
                    setInput(`Explain the most important Grade ${profile.grade} CAPS concepts for ${subject.name}.`);
                    setActivePane("progress");
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

          <Card className={`${activePane !== "history" ? "hidden lg:block" : ""}`}>
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

          <Card className={`${activePane !== "progress" ? "hidden lg:block" : ""}`}>
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

          <Card className={`${activePane !== "sources" ? "hidden lg:block" : ""}`}>
            <h2 className="text-lg font-black">CAPS source pack</h2>
            <p className="mt-1 text-sm text-ink/65">Official DBE curriculum and learner support material used by the coach.</p>
            <div className="mt-3 space-y-2">
              {capsContent.slice(0, 3).map((item) => (
                <a
                  key={`${item.title}-${item.subject}`}
                  href={item.sourceUrl}
                  target="_blank"
                  className="block rounded-lg border border-ink/10 bg-white px-3 py-2 hover:bg-chalk"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{item.title}</p>
                    <Badge tone="sample">{item.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink/60">
                    {item.subject} {item.grade === "all" ? "" : `• Grade ${item.grade}`} • {item.summary}
                  </p>
                </a>
              ))}
              {capsSections.slice(0, 3).map((section) => (
                <details key={`${section.sectionTitle}-${section.topic}`} className="rounded-lg border border-ink/10 bg-white px-3 py-2">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{section.sectionTitle}</p>
                        <p className="mt-1 text-xs text-ink/55">{section.subject} {section.grade === "all" ? "" : `• Grade ${section.grade}`} • {section.topic}</p>
                      </div>
                      <Badge tone="watch">{section.sourceType}</Badge>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-ink/70">{section.sectionSummary}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/80">{section.sectionText}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {section.keywords.slice(0, 4).map((keyword) => (
                      <Badge key={keyword} tone="neutral">{keyword}</Badge>
                    ))}
                  </div>
                  <a href={section.sourceUrl} target="_blank" className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-black text-veld">
                    Open source <span aria-hidden="true">↗</span>
                  </a>
                </details>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function MessageBubble({
  msg,
  onRate,
  onAction
}: {
  msg: ChatMessage;
  onRate: (message: ChatMessage, feedback: "helpful" | "needs_work") => Promise<void>;
  onAction: (message: ChatMessage, action: "continue" | "simpler" | "practice" | "mark" | "switch") => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-veld px-4 py-3 text-sm text-white">{msg.content}</div>
      </div>
    );
  }

  const toneClass =
    msg.review ? "border-amber-200 bg-amber-50/90" : msg.coachMode === "practice" ? "border-sky-200 bg-sky-50/80" : msg.coachMode === "revise" ? "border-veld/20 bg-veld/5" : "border-ink/10 bg-white";

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-white">
        <Bot size={14} />
      </div>
      <div className={`min-w-0 flex-1 rounded-2xl rounded-tl-sm border px-4 py-3 ${toneClass}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-ink/45">
          {msg.coachMode ? <Badge tone="neutral">Mode: {msg.coachMode}</Badge> : null}
          {msg.topicLabel ? <span className="truncate">Topic: {msg.topicLabel}</span> : null}
        </div>
        {msg.streaming && !msg.content ? (
          <p className="animate-pulse text-sm text-ink/50">Thinking…</p>
        ) : msg.plan ? (
          <PlanView content={msg.content} tasks={msg.plan} />
        ) : msg.review ? (
          <ReviewView review={msg.review} content={msg.content} />
        ) : (
          <>
            <Markdown content={msg.content} />
            {msg.streaming ? <span className="animate-pulse font-mono text-veld">▌</span> : null}
          </>
        )}
        {msg.sourceTags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {msg.sourceTags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {!msg.streaming && msg.role === "assistant" ? (
          <div className="mt-3 border-t border-ink/10 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink/45">Was this helpful?</span>
            <button
              onClick={() => onRate(msg, "helpful")}
              disabled={msg.feedback === "helpful"}
              className={`focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-bold ${
                msg.feedback === "helpful" ? "border-veld bg-veld text-white" : "border-ink/10 text-ink/60 hover:bg-chalk"
              }`}
            >
              <CheckCircle2 size={12} /> Helpful
            </button>
            <button
              onClick={() => onRate(msg, "needs_work")}
              disabled={msg.feedback === "needs_work"}
              className={`focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-bold ${
                msg.feedback === "needs_work" ? "border-protea bg-protea text-white" : "border-ink/10 text-ink/60 hover:bg-chalk"
              }`}
            >
              <Flame size={12} /> Needs work
            </button>
              {msg.coachMode ? <span className="ml-auto text-ink/40">Mode: {msg.coachMode}</span> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => onAction(msg, "continue")} className="focus-ring rounded-full border border-ink/10 px-2.5 py-1 font-bold text-ink/60 hover:bg-chalk">
                Continue topic
              </button>
              <button onClick={() => onAction(msg, "simpler")} className="focus-ring rounded-full border border-ink/10 px-2.5 py-1 font-bold text-ink/60 hover:bg-chalk">
                Explain simpler
              </button>
              <button onClick={() => onAction(msg, "practice")} className="focus-ring rounded-full border border-ink/10 px-2.5 py-1 font-bold text-ink/60 hover:bg-chalk">
                Another question
              </button>
              <button onClick={() => onAction(msg, "mark")} className="focus-ring rounded-full border border-ink/10 px-2.5 py-1 font-bold text-ink/60 hover:bg-chalk">
                Mark my answer
              </button>
              <button onClick={() => onAction(msg, "switch")} className="focus-ring rounded-full border border-ink/10 px-2.5 py-1 font-bold text-ink/60 hover:bg-chalk">
                Switch subject
              </button>
            </div>
          </div>
        ) : null}
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

function buildSourceSummary(grounding: {
  apsRules?: unknown[];
  bursaries?: unknown[];
  pastPaperQuestions?: unknown[];
  capsContent?: unknown[];
  capsSections?: unknown[];
}) {
  const parts = [
    grounding.capsSections && Array.isArray(grounding.capsSections) && grounding.capsSections.length > 0 ? "CAPS" : null,
    grounding.capsContent && Array.isArray(grounding.capsContent) && grounding.capsContent.length > 0 ? "DBE" : null,
    grounding.pastPaperQuestions && Array.isArray(grounding.pastPaperQuestions) && grounding.pastPaperQuestions.length > 0 ? "Past papers" : null,
    grounding.apsRules && Array.isArray(grounding.apsRules) && grounding.apsRules.length > 0 ? "APS" : null,
    grounding.bursaries && Array.isArray(grounding.bursaries) && grounding.bursaries.length > 0 ? "Bursaries" : null
  ].filter((item): item is string => Boolean(item));

  return parts.length > 0 ? parts.join(" • ") : "";
}

function deriveSourceTags(grounding: {
  apsRules?: unknown[];
  bursaries?: unknown[];
  pastPaperQuestions?: unknown[];
  capsContent?: unknown[];
  capsSections?: unknown[];
}) {
  return [
    grounding.capsSections && Array.isArray(grounding.capsSections) && grounding.capsSections.length > 0 ? "CAPS" : null,
    grounding.capsContent && Array.isArray(grounding.capsContent) && grounding.capsContent.length > 0 ? "DBE" : null,
    grounding.pastPaperQuestions && Array.isArray(grounding.pastPaperQuestions) && grounding.pastPaperQuestions.length > 0 ? "Past papers" : null,
    grounding.apsRules && Array.isArray(grounding.apsRules) && grounding.apsRules.length > 0 ? "APS" : null
  ].filter((item): item is string => Boolean(item));
}

function ReviewView({ content, review }: { content: string; review: AnswerReview }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">{content}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-emerald-50 p-3">
          <p className="text-xs font-black text-emerald-700">Strengths</p>
          <ul className="mt-2 space-y-1 pl-4">
            {review.strengths.map((item, index) => (
              <li key={index} className="list-disc text-sm leading-6 text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-ink/10 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-700">Improve</p>
          <ul className="mt-2 space-y-1 pl-4">
            {review.improvements.map((item, index) => (
              <li key={index} className="list-disc text-sm leading-6 text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-lg border border-ink/10 bg-chalk p-3 text-sm">
        <p className="font-black text-ink">Summary</p>
        <p className="mt-1 leading-6 text-ink/80">{review.summary}</p>
        <p className="mt-2 text-xs font-bold text-protea">Likely marks lost: {review.likelyMarksLost}</p>
        <p className="mt-1 text-xs text-ink/60">Confidence: {review.confidence}</p>
        <p className="mt-1 text-xs text-ink/60">Next step: {review.nextStep}</p>
        {review.modelAnswer ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-black text-veld">Show model answer</summary>
            <p className="mt-2 text-sm leading-6 text-ink/75">{review.modelAnswer}</p>
          </details>
        ) : null}
      </div>
    </div>
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

function normaliseReview(result: unknown): AnswerReview {
  const fallback: AnswerReview = {
    summary: "Your answer needs a bit more detail and clearer steps.",
    strengths: ["You attempted the question."],
    improvements: ["Show your working more clearly."],
    likelyMarksLost: 2,
    nextStep: "Rewrite the solution step by step.",
    confidence: "medium"
  };

  if (!result || typeof result !== "object") return fallback;
  const review = result as Partial<AnswerReview>;
  return {
    summary: typeof review.summary === "string" ? review.summary : fallback.summary,
    strengths: Array.isArray(review.strengths) ? review.strengths.filter((item): item is string => typeof item === "string") : fallback.strengths,
    improvements: Array.isArray(review.improvements)
      ? review.improvements.filter((item): item is string => typeof item === "string")
      : fallback.improvements,
    likelyMarksLost: typeof review.likelyMarksLost === "number" ? review.likelyMarksLost : fallback.likelyMarksLost,
    nextStep: typeof review.nextStep === "string" ? review.nextStep : fallback.nextStep,
    modelAnswer: typeof review.modelAnswer === "string" ? review.modelAnswer : undefined,
    confidence: review.confidence === "low" || review.confidence === "medium" || review.confidence === "high" ? review.confidence : fallback.confidence
  };
}
