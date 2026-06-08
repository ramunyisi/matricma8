"use client";

import { useEffect, useState } from "react";
import { Bot, CalendarPlus, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { loadApsRules, loadBursaries, loadPastPaperQuestions } from "@/lib/content-data";
import { sampleApsRules, sampleBursaries, sampleQuestions } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { saveStudyPlan } from "@/lib/study-plan-data";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import type { ApsRule, Bursary, PastPaperQuestion, StudyTask } from "@/lib/types";
import { friendlyError } from "@/lib/utils";

export default function StudyCoachPage() {
  const { profile, isDemo } = useLearnerProfile();
  const [apsRules, setApsRules] = useState<ApsRule[]>(sampleApsRules);
  const [bursaries, setBursaries] = useState<Bursary[]>(sampleBursaries);
  const [questions, setQuestions] = useState<PastPaperQuestion[]>(sampleQuestions);
  const [question, setQuestion] = useState("Please explain functions and graphs simply.");
  const [grade10Mode, setGrade10Mode] = useState(true);
  const [answer, setAnswer] = useState("Ask a CAPS topic question or generate a 7-day study plan.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([loadApsRules(supabase), loadBursaries(supabase), loadPastPaperQuestions(supabase)]).then(([rules, loadedBursaries, loadedQuestions]) => {
      setApsRules(rules);
      setBursaries(loadedBursaries);
      setQuestions(loadedQuestions);
    });
  }, []);

  const grounding = {
    apsRules: apsRules.map((rule) => ({ institutionName: rule.institutionName, programmeName: rule.programmeName, sourceUrl: rule.sourceUrl, lastVerifiedAt: rule.lastVerifiedAt })),
    bursaries: bursaries.map((bursary) => ({ name: bursary.name, fieldOfStudy: bursary.fieldOfStudy, deadline: bursary.deadline, sourceUrl: bursary.sourceUrl, lastVerifiedAt: bursary.lastVerifiedAt })),
    pastPaperQuestions: questions.map((item) => ({ subject: item.subject, topic: item.topic, year: item.year, sourceUrl: item.sourceUrl }))
  };

  async function askCoach() {
    setLoading(true);
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "explain",
        subject: "Mathematics",
        grade: profile.grade,
        topic: "Functions and graphs",
        question,
        grade10Mode,
        grounding
      })
    });
    const data = await response.json();
    setAnswer(data.result);
    setLoading(false);
  }

  async function plan() {
    setLoading(true);
    try {
      const response = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "plan", profile, grounding }) });
      const data = await response.json();
      const tasks = normalisePlan(data.result, profile);
      const supabase = getSupabaseBrowserClient();
      if (supabase && !isDemo) await saveStudyPlan(supabase, profile, tasks);
      setAnswer(JSON.stringify(data.result, null, 2));
    } catch (error) {
      const fallback = generateLocalStudyPlan(profile);
      setAnswer(`${friendlyError(error, "Generated a local fallback plan.")}\n\n${JSON.stringify(fallback, null, 2)}`);
    }
    setLoading(false);
  }

  return (
      <AppShell>
      <PageHeader title="AI Study Coach" eyebrow="Server-side Gemini ready">
        The coach uses simple English and must say when official facts, bursary deadlines, DBE paper content, or university requirements need verification.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-black"><Bot className="text-veld" /> Ask a CAPS question</h2>
            <Badge tone="sample">{isDemo ? "Demo profile" : `Grade ${profile.grade}`}</Badge>
          </div>
          <textarea className="focus-ring mt-4 min-h-36 w-full rounded-lg border border-ink/15 p-3" value={question} onChange={(event) => setQuestion(event.target.value)} />
          <label className="mt-3 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={grade10Mode} onChange={(event) => setGrade10Mode(event.target.checked)} />
            Explain like I am in Grade 10
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={askCoach} disabled={loading} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-veld px-4 py-3 font-black text-white disabled:opacity-60">
              <Send size={18} /> Ask coach
            </button>
            <button onClick={plan} disabled={loading} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-3 font-black disabled:opacity-60">
              <CalendarPlus size={18} /> Generate 7-day plan
            </button>
          </div>
          <pre className="mt-5 whitespace-pre-wrap rounded-lg bg-ink p-4 text-sm leading-6 text-white">{loading ? "Thinking..." : answer}</pre>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Recommended context</h2>
          <div className="mt-4 space-y-3">
            {questions.slice(0, 4).map((question) => (
              <div key={question.id} className="rounded-lg bg-chalk p-3">
                <p className="font-bold">{question.subject}</p>
                <p className="mt-1 text-sm text-ink/65">{question.topic}</p>
                <p className="mt-2 text-xs font-bold text-sky">Use metadata only. Open DBE source for official question and memo.</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-protea/20 bg-protea/10 p-3 text-sm leading-6 text-ink/75">
            Safety rule: MatricSA must not invent official admission, bursary, or DBE facts. It should use stored source URLs and verification dates.
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function normalisePlan(result: unknown, profile: ReturnType<typeof useLearnerProfile>["profile"]): StudyTask[] {
  if (Array.isArray(result)) return result as StudyTask[];
  if (result && typeof result === "object" && Array.isArray((result as { tasks?: unknown[] }).tasks)) {
    return (result as { tasks: StudyTask[] }).tasks;
  }
  return generateLocalStudyPlan(profile);
}
