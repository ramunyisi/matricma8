"use client";

import { Download, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { demoProfile } from "@/lib/sample-data";
import { calculateAverage, subjectRisk } from "@/lib/aps";

const sampleLearners = [
  { name: "Demo learner A", profile: demoProfile },
  {
    name: "Demo learner B",
    profile: {
      ...demoProfile,
      id: "demo-b",
      subjects: demoProfile.subjects.map((subject, index) => ({
        ...subject,
        id: `${subject.id}-b`,
        currentMark: Math.max(35, subject.currentMark - 8 - index),
        targetMark: subject.targetMark
      }))
    }
  },
  {
    name: "Demo learner C",
    profile: {
      ...demoProfile,
      id: "demo-c",
      subjects: demoProfile.subjects.map((subject, index) => ({
        ...subject,
        id: `${subject.id}-c`,
        currentMark: Math.min(88, subject.currentMark + 4 + index),
        targetMark: subject.targetMark
      }))
    }
  }
];

export default function ClassroomPage() {
  const atRiskCount = sampleLearners.filter((learner) => learner.profile.subjects.some((subject) => subjectRisk(subject.currentMark, subject.targetMark) === "At Risk")).length;

  return (
    <AppShell>
      <PageHeader title="Classroom Dashboard" eyebrow="Teacher progress view">
        Review learner risk, average marks, subject gaps, and export-ready intervention notes.
      </PageHeader>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Metric label="Learners" value={String(sampleLearners.length)} />
        <Metric label="At risk" value={String(atRiskCount)} />
        <Metric label="Class average" value={`${Math.round(sampleLearners.reduce((sum, learner) => sum + calculateAverage(learner.profile.subjects), 0) / sampleLearners.length)}%`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-black"><Users className="text-veld" /> Learner risk list</h2>
            <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm font-black">
              <Download size={16} /> Export
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {sampleLearners.map((learner) => {
              const average = calculateAverage(learner.profile.subjects);
              const riskySubjects = learner.profile.subjects.filter((subject) => subjectRisk(subject.currentMark, subject.targetMark) !== "Safe");
              return (
                <div key={learner.profile.id} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{learner.name}</p>
                      <p className="text-sm font-semibold text-ink/55">Grade {learner.profile.grade} · {learner.profile.province}</p>
                    </div>
                    <Badge tone={riskySubjects.length > 0 ? "watch" : "safe"}>{average}% avg</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {learner.profile.subjects.slice(0, 4).map((subject) => (
                      <div key={subject.id} className="rounded-lg bg-chalk p-3">
                        <p className="text-sm font-black">{subject.name}</p>
                        <ProgressBar value={subject.currentMark} target={subject.targetMark} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Intervention queue</h2>
          <div className="mt-4 space-y-3">
            {sampleLearners.flatMap((learner) =>
              learner.profile.subjects
                .filter((subject) => subjectRisk(subject.currentMark, subject.targetMark) !== "Safe")
                .slice(0, 2)
                .map((subject) => (
                  <div key={`${learner.profile.id}-${subject.id}`} className="rounded-lg bg-chalk p-3">
                    <p className="font-black">{learner.name}</p>
                    <p className="mt-1 text-sm font-semibold text-ink/65">{subject.name}: {subject.currentMark}% toward {subject.targetMark}%</p>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><p className="text-sm font-bold text-ink/55">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></Card>;
}
