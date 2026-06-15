"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { calculateAps, calculateAverage, subjectRisk } from "@/lib/aps";
import { matchBursaries } from "@/lib/bursaries";
import { loadApsRules, loadBursaries, loadPastPaperQuestions } from "@/lib/content-data";
import { sampleApsRules, sampleBursaries, sampleQuestions } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { loadOrCreateStudyPlan, updateStudyTaskCompletion } from "@/lib/study-plan-data";
import type { ApsRule, Bursary, PastPaperQuestion, StudyTask } from "@/lib/types";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import { formatDate, friendlyError } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const { profile, isDemo, isLoading, error } = useLearnerProfile();
  const [apsRules, setApsRules] = useState<ApsRule[]>(sampleApsRules);
  const [bursaries, setBursaries] = useState<Bursary[]>(sampleBursaries);
  const [questions, setQuestions] = useState<PastPaperQuestion[]>(sampleQuestions);
  const [plan, setPlan] = useState<StudyTask[]>([]);
  const [planMessage, setPlanMessage] = useState("");
  const [lastCoachSubject, setLastCoachSubject] = useState("");
  const [recentCoachTopics, setRecentCoachTopics] = useState<string[]>([]);
  const allBursaryMatches = matchBursaries(profile, bursaries);
  const bursaryMatches = allBursaryMatches.slice(0, 3);
  const completedTasks = plan.filter((t) => t.completed).length;
  const selectedRule = apsRules[0] ?? sampleApsRules[0];
  const aps = calculateAps(profile.subjects, selectedRule);
  const average = calculateAverage(profile.subjects);
  const progress = profile.subjects.map((subject) => ({ name: subject.name.split(" ")[0], mark: subject.currentMark, target: subject.targetMark }));
  const atRisk = profile.subjects.filter((subject) => subjectRisk(subject.currentMark, subject.targetMark) !== "Safe");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([loadApsRules(supabase), loadBursaries(supabase), loadPastPaperQuestions(supabase)]).then(([rules, loadedBursaries, loadedQuestions]) => {
      setApsRules(rules);
      setBursaries(loadedBursaries);
      setQuestions(loadedQuestions);
    });
  }, []);

  useEffect(() => {
    if (!profile.subjects.length) return;
    const supabase = getSupabaseBrowserClient();
    loadOrCreateStudyPlan(supabase, profile)
      .then(setPlan)
      .catch((planError) => setPlanMessage(friendlyError(planError, "Could not load study plan.")));
  }, [profile]);

  useEffect(() => {
    try {
      const savedSubject = localStorage.getItem("matricsa-study-coach-subject");
      const savedTopics = localStorage.getItem("matricsa-study-coach-topics");
      if (savedSubject) setLastCoachSubject(savedSubject);
      if (savedTopics) {
        const parsed = JSON.parse(savedTopics);
        if (Array.isArray(parsed)) {
          setRecentCoachTopics(parsed.filter((item): item is string => typeof item === "string").slice(0, 3));
        }
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

  async function toggleTask(task: StudyTask) {
    const nextCompleted = !task.completed;
    setPlan((current) => current.map((item) => item === task ? { ...item, completed: nextCompleted } : item));
    if (!task.id) return;
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await updateStudyTaskCompletion(supabase, task.id, nextCompleted);
    } catch (toggleError) {
      setPlanMessage(friendlyError(toggleError, "Could not update task."));
      setPlan((current) => current.map((item) => item.id === task.id ? { ...item, completed: !nextCompleted } : item));
    }
  }

  return (
    <AppShell>
      <PageHeader title="Learner Dashboard" eyebrow={isDemo ? "Demo workspace" : `${profile.grade} learner profile`}>
        Predictions use sample data and must be verified against official university, DBE, and bursary source pages before decisions are made.
      </PageHeader>
      {isLoading ? <Card className="mb-4">Loading learner profile...</Card> : null}
      {error ? <Card className="mb-4 border-protea/20 bg-protea/10">{error}</Card> : null}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="APS Estimate" value={String(aps)} sub="NSC point estimate" />
        <StatCard
          label="Average"
          value={`${average}%`}
          sub="across all subjects"
          tone={average >= 60 ? "safe" : average >= 50 ? "watch" : "neutral"}
        />
        <StatCard
          label="Weekly plan"
          value={plan.length ? `${completedTasks}/${plan.length}` : "—"}
          sub="tasks complete"
          tone={plan.length > 0 && completedTasks === plan.length ? "safe" : "neutral"}
        />
        <StatCard label="Bursary matches" value={String(allBursaryMatches.length)} sub="open bursaries" />
      </div>
      <Card className="mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Resume study</h2>
            <p className="text-sm text-ink/65">Jump back into the last subject and topic you worked on.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={buildCoachHref(lastCoachSubject, recentCoachTopics[0], "practice")} className="focus-ring rounded-lg bg-veld px-3 py-2 text-sm font-black text-white">
              Open coach
            </Link>
            <Link href={buildCoachHref(lastCoachSubject, recentCoachTopics[0], "explain")} className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-sm font-black">
              Explain it
            </Link>
            <Link href="/aps" className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-sm font-black">
              APS
            </Link>
            <Link href="/past-papers" className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-sm font-black">
              Papers
            </Link>
            <Link href="/bursaries" className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-sm font-black">
              Bursaries
            </Link>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-ink/10 bg-chalk p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">Last coach subject</p>
            <p className="mt-1 text-base font-black">{lastCoachSubject || "No subject saved yet"}</p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-chalk p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">Recent topic</p>
            <p className="mt-1 text-base font-black">{recentCoachTopics[0] || "No topic saved yet"}</p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-chalk p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">Next best action</p>
            <p className="mt-1 text-base font-black">Open the coach and continue the last topic</p>
          </div>
        </div>
        {recentCoachTopics.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {recentCoachTopics.map((topic) => (
              <Link
                key={topic}
                href={buildCoachHref(lastCoachSubject, topic, "practice")}
                className="focus-ring rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-chalk"
              >
                {topic.length > 38 ? `${topic.slice(0, 38)}…` : topic}
              </Link>
            ))}
          </div>
        ) : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Weekly study plan</h2>
              <p className="text-sm text-ink/65">Prioritised by mark gaps and risk level.</p>
            </div>
            <Badge tone="sample">AI-ready</Badge>
          </div>
          {planMessage ? <p className="mt-3 rounded-lg bg-protea/10 p-3 text-sm font-bold text-ink">{planMessage}</p> : null}
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {plan.map((task) => (
              <button key={`${task.day}-${task.subject}-${task.topic}`} onClick={() => toggleTask(task)} className={`rounded-lg border border-ink/10 p-3 text-left transition ${task.completed ? "bg-veld/10" : "bg-chalk"}`}>
                <p className="flex items-center justify-between gap-2 font-black">
                  {task.day}
                  <span className={`h-4 w-4 rounded border ${task.completed ? "border-veld bg-veld" : "border-ink/25 bg-white"}`} />
                </p>
                <p className="mt-2 text-sm font-bold">{task.subject}</p>
                <p className="mt-1 text-xs leading-5 text-ink/65">{task.topic}</p>
                <p className="mt-2 text-xs font-bold text-veld">{task.durationMinutes} min</p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm font-bold text-ink/65">
            {plan.filter((task) => task.completed).length}/{plan.length} tasks complete
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-black">APS estimate</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Average" value={`${average}%`} />
            <Metric label="APS" value={String(aps)} />
          </div>
          <p className="mt-4 text-sm leading-6 text-ink/65">Using configurable rule: {selectedRule.programmeName}.</p>
        </Card>
      </div>
      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Reminder schedule</h2>
            <p className="text-sm text-ink/65">This is the next automated reminder window MatricSA will use.</p>
          </div>
          <Link href="/notifications" className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-sm font-black">Open settings</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Study reminders" value={profile.whatsappStudyReminders ? `${padHour(profile.studyReminderHour ?? 18)}:00` : "Off"} />
          <Metric label="Deadline reminders" value={profile.whatsappDeadlineReminders ? `${padHour(profile.deadlineReminderHour ?? 10)}:00` : "Off"} />
          <Metric label="Quiet hours" value={`${padHour(profile.quietHoursStart ?? 20)}:00-${padHour(profile.quietHoursEnd ?? 6)}:00`} />
        </div>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><AlertTriangle className="text-protea" size={20} /> Subjects at risk</h2>
          <div className="mt-4 space-y-4">
            {atRisk.map((subject) => {
              const risk = subjectRisk(subject.currentMark, subject.targetMark);
              return (
                <div key={subject.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{subject.name}</p>
                    <Badge tone={risk === "At Risk" ? "risk" : "watch"}>{risk}</Badge>
                  </div>
                  <ProgressBar value={subject.currentMark} target={subject.targetMark} />
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Recommended questions</h2>
          <div className="mt-4 space-y-3">
            {questions.slice(0, 3).map((question) => (
              <a key={question.id} href={question.sourceUrl} target="_blank" className="block rounded-lg border border-ink/10 p-3 hover:bg-chalk">
                <p className="font-bold">{question.subject}</p>
                <p className="text-sm text-ink/65">{question.topic} - {question.year} {question.paperNumber}</p>
              </a>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Bursary matches</h2>
          <div className="mt-4 space-y-3">
            {bursaryMatches.map((match) => (
              <div key={match.bursary.id} className="rounded-lg border border-ink/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{match.bursary.name}</p>
                  <Badge tone="safe">{match.matchScore}%</Badge>
                </div>
                <p className="mt-1 text-xs text-ink/60">Deadline {formatDate(match.bursary.deadline)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays size={20} /> Upcoming deadlines</h2>
          <div className="mt-4 space-y-3">
            {bursaries.slice(0, 4).map((bursary) => (
              <a key={bursary.id} className="flex items-center justify-between gap-3 rounded-lg bg-chalk p-3 text-sm" href={bursary.applicationUrl} target="_blank">
                <span>{bursary.name}</span>
                <span className="inline-flex items-center gap-1 font-bold text-sky">{formatDate(bursary.deadline)} <ExternalLink size={14} /></span>
              </a>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><CheckCircle2 className="text-veld" size={20} /> Progress chart</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progress}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="target" stroke="#f2b84b" fill="#f2b84b" fillOpacity={0.18} />
                <Area type="monotone" dataKey="mark" stroke="#1f8a70" fill="#1f8a70" fillOpacity={0.28} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function padHour(hour: number) {
  return String(hour).padStart(2, "0");
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-chalk p-4">
      <p className="text-sm font-bold text-ink/60">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function buildCoachHref(subject?: string, topic?: string, mode?: string) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (topic) params.set("topic", topic);
  if (mode) params.set("mode", mode);
  const query = params.toString();
  return query ? `/study-coach?${query}` : "/study-coach";
}
