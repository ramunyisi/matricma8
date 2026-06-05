"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, ProgressBar } from "@/components/ui";
import { provinces, sampleSubjects } from "@/lib/sample-data";

export default function OnboardingPage() {
  const [selected, setSelected] = useState(["Mathematics", "Physical Sciences", "English Home Language", "Life Sciences"]);
  const subjectRows = useMemo(() => selected.map((name, index) => ({ name, current: 45 + index * 6, target: 60 + index * 5 })), [selected]);

  return (
    <AppShell>
      <PageHeader title="Learner Onboarding" eyebrow="Profile setup">
        Capture enough context for useful planning while avoiding sensitive data that is not needed for the MVP.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-black">Learner details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Grade"><select className="focus-ring input"><option>10</option><option>11</option><option selected>12</option></select></Field>
            <Field label="Province"><select className="focus-ring input">{provinces.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="School name optional"><input className="focus-ring input" placeholder="Optional" /></Field>
            <Field label="Home language"><input className="focus-ring input" defaultValue="English" /></Field>
            <Field label="Internet access"><select className="focus-ring input"><option>low</option><option selected>medium</option><option>high</option></select></Field>
            <Field label="Exam or goal date"><input className="focus-ring input" type="date" defaultValue="2026-10-19" /></Field>
          </div>
          <Field label="Career interests"><input className="focus-ring input" defaultValue="Engineering, data science, commerce" /></Field>
          <Field label="Preferred study times"><input className="focus-ring input" defaultValue="Weekday evenings, Saturday morning" /></Field>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Subjects and marks</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {sampleSubjects.map((subject) => (
              <label key={subject} className="flex items-center gap-2 rounded-lg border border-ink/10 p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={selected.includes(subject)}
                  onChange={() => setSelected((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject])}
                />
                {subject}
              </label>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {subjectRows.map((subject) => (
              <div key={subject.name}>
                <div className="flex items-center justify-between">
                  <p className="font-bold">{subject.name}</p>
                  <p className="text-sm text-ink/60">{subject.current}% now</p>
                </div>
                <ProgressBar value={subject.current} target={subject.target} />
              </div>
            ))}
          </div>
          <button className="focus-ring mt-5 w-full rounded-lg bg-veld px-4 py-3 font-black text-white">Save profile</button>
        </Card>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(23 33 43 / 0.15);
          padding: 0.75rem;
        }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-4 block text-sm font-bold text-ink/80">{label}<span className="mt-2 block">{children}</span></label>;
}
