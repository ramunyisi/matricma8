"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { calculateAps, calculateAverage, subjectRisk } from "@/lib/aps";
import { matchBursaries } from "@/lib/bursaries";
import { demoProfile, sampleApsRules, sampleBursaries, sampleQuestions } from "@/lib/sample-data";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const plan = generateLocalStudyPlan(demoProfile);
  const bursaryMatches = matchBursaries(demoProfile, sampleBursaries).slice(0, 3);
  const aps = calculateAps(demoProfile.subjects, sampleApsRules[0]);
  const average = calculateAverage(demoProfile.subjects);
  const progress = demoProfile.subjects.map((subject) => ({ name: subject.name.split(" ")[0], mark: subject.currentMark, target: subject.targetMark }));
  const atRisk = demoProfile.subjects.filter((subject) => subjectRisk(subject.currentMark, subject.targetMark) !== "Safe");

  return (
    <AppShell>
      <PageHeader title="Learner Dashboard" eyebrow="Demo workspace">
        Predictions use sample data and must be verified against official university, DBE, and bursary source pages before decisions are made.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Weekly study plan</h2>
              <p className="text-sm text-ink/65">Prioritised by mark gaps and risk level.</p>
            </div>
            <Badge tone="sample">AI-ready</Badge>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {plan.map((task) => (
              <div key={task.day} className="rounded-lg border border-ink/10 bg-chalk p-3">
                <p className="font-black">{task.day}</p>
                <p className="mt-2 text-sm font-bold">{task.subject}</p>
                <p className="mt-1 text-xs leading-5 text-ink/65">{task.topic}</p>
                <p className="mt-2 text-xs font-bold text-veld">{task.durationMinutes} min</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">APS estimate</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Average" value={`${average}%`} />
            <Metric label="APS" value={String(aps)} />
          </div>
          <p className="mt-4 text-sm leading-6 text-ink/65">Using configurable sample rule: {sampleApsRules[0].programmeName}.</p>
        </Card>
      </div>
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
            {sampleQuestions.map((question) => (
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
            {sampleBursaries.map((bursary) => (
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-chalk p-4">
      <p className="text-sm font-bold text-ink/60">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}
