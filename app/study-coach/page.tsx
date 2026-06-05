"use client";

import { useState } from "react";
import { Bot, CalendarPlus, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { sampleQuestions } from "@/lib/sample-data";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { useLearnerProfile } from "@/lib/use-learner-profile";

export default function StudyCoachPage() {
  const { profile, isDemo } = useLearnerProfile();
  const [question, setQuestion] = useState("Please explain functions and graphs simply.");
  const [grade10Mode, setGrade10Mode] = useState(true);
  const [answer, setAnswer] = useState("Ask a CAPS topic question or generate a 7-day study plan.");
  const [loading, setLoading] = useState(false);

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
        grade10Mode
      })
    });
    const data = await response.json();
    setAnswer(data.result);
    setLoading(false);
  }

  async function plan() {
    setLoading(true);
    try {
      const response = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "plan", profile }) });
      const data = await response.json();
      setAnswer(JSON.stringify(data.result, null, 2));
    } catch {
      setAnswer(JSON.stringify(generateLocalStudyPlan(profile), null, 2));
    }
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader title="AI Study Coach" eyebrow="Server-side OpenAI ready">
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
            {sampleQuestions.map((question) => (
              <div key={question.id} className="rounded-lg bg-chalk p-3">
                <p className="font-bold">{question.subject}</p>
                <p className="mt-1 text-sm text-ink/65">{question.topic}</p>
                <p className="mt-2 text-xs font-bold text-sky">Use metadata only. Open DBE source for official question and memo.</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-protea/20 bg-protea/10 p-3 text-sm leading-6 text-ink/75">
            Safety rule: MatricMate SA must not invent official admission, bursary, or DBE facts. It should use stored source URLs and verification dates.
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
