"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Compass, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { careerPaths } from "@/lib/career-paths";

export default function PathwaysPage() {
  const [pathId, setPathId] = useState(careerPaths[0].id);
  const selectedPath = useMemo(() => careerPaths.find((path) => path.id === pathId) ?? careerPaths[0], [pathId]);

  return (
    <AppShell>
      <PageHeader title="Career-path guidance" eyebrow="Grade 10 to 12 planning">
        Compare a few major South African study routes, see the subjects that matter, and track the marks learners should try to hold from Grade 10 through Grade 12.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink/55">Pick a pathway</p>
              <h2 className="mt-1 text-2xl font-black">{selectedPath.title}</h2>
            </div>
            <Badge tone="sample">Learner guidance</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/70">{selectedPath.summary}</p>
          <label className="mt-4 block text-sm font-bold">
            Study path
            <select className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-3" value={pathId} onChange={(event) => setPathId(event.target.value)}>
              {careerPaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.title}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 rounded-lg bg-chalk p-3">
            <p className="text-xs font-black uppercase tracking-wide text-ink/55">Subjects to protect</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedPath.focusSubjects.map((subject) => (
                <span key={subject} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm">
                  {subject}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <GradeBlock grade={selectedPath.gradeTargets.grade} marks={selectedPath.gradeTargets.marks} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/aps" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">
              Open APS calculator
              <ArrowRight size={16} />
            </a>
            <a href="/universities" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2 text-sm font-black text-ink">
              Compare universities
            </a>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink/55">University examples from prospectuses</p>
              <h2 className="mt-1 text-2xl font-black">Where this pathway leads</h2>
            </div>
            <GraduationCap className="text-veld" />
          </div>
          <div className="mt-4 grid gap-3">
            {selectedPath.programmeExamples.map((programme) => (
              <div key={`${programme.institution}-${programme.programme}`} className="rounded-lg border border-ink/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink/55">{programme.institution}</p>
                    <h3 className="mt-1 text-lg font-black">{programme.programme}</h3>
                  </div>
                  <Badge tone="watch">APS {programme.aps}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/70">{programme.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-veld/5 p-3 text-sm leading-6 text-ink/70">
            The marks here are guidance, not official admission decisions. Use the APS calculator and the official university page before applying.
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center gap-2">
          <Compass className="text-veld" />
          <h2 className="text-xl font-black">How to use this across Grades 10 to 12</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <TimelineCard
            grade="Grade 10"
            text="Build your subject base. Keep the core subjects above 55-60% and choose subjects that keep the career route open."
          />
          <TimelineCard
            grade="Grade 11"
            text="This is the important benchmark year. Many universities look at Grade 11 results when you apply early, so try to move the core subjects into the 60-70% range."
          />
          <TimelineCard
            grade="Grade 12"
            text="Push for the final APS target. If the route is competitive, the final year should put you above the minimum by a comfortable margin."
          />
        </div>
      </Card>
    </AppShell>
  );
}

function GradeBlock({ grade, marks }: { grade: 10 | 11 | 12; marks: string[] }) {
  return (
    <div className="rounded-lg border border-ink/10 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-ink/55">{`Grade ${grade} target`}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-ink/75">
        {marks.map((mark) => (
          <li key={mark}>- {mark}</li>
        ))}
      </ul>
    </div>
  );
}

function TimelineCard({ grade, text }: { grade: string; text: string }) {
  return (
    <div className="rounded-lg bg-chalk p-3">
      <p className="text-sm font-black text-veld">{grade}</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">{text}</p>
    </div>
  );
}
