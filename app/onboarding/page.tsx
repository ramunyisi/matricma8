"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, ProgressBar } from "@/components/ui";
import { provinces, sampleSubjects } from "@/lib/sample-data";
import { saveLearnerProfile } from "@/lib/learner-profile";
import type { InternetAccessLevel } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { friendlyError } from "@/lib/utils";

export default function OnboardingPage() {
  const [selected, setSelected] = useState(["Mathematics", "Physical Sciences", "English Home Language", "Life Sciences"]);
  const [grade, setGrade] = useState<10 | 11 | 12>(12);
  const [province, setProvince] = useState("Gauteng");
  const [schoolName, setSchoolName] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("English");
  const [internetAccessLevel, setInternetAccessLevel] = useState<InternetAccessLevel>("medium");
  const [examDate, setExamDate] = useState("2026-10-19");
  const [careerInterests, setCareerInterests] = useState("Engineering, data science, commerce");
  const [preferredStudyTimes, setPreferredStudyTimes] = useState("Weekday evenings, Saturday morning");
  const [marks, setMarks] = useState<Record<string, { currentMark: number; targetMark: number }>>(
    Object.fromEntries(sampleSubjects.map((subject, index) => [subject, { currentMark: 45 + index * 2, targetMark: 65 }]))
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const subjectRows = useMemo(() => selected.map((name) => ({ name, ...marks[name] })), [selected, marks]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) {
      setMessage("Select at least one subject.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = {
      grade,
      province,
      schoolName,
      homeLanguage,
      internetAccessLevel,
      examDate,
      careerInterests: splitList(careerInterests),
      preferredStudyTimes: splitList(preferredStudyTimes),
      subjects: subjectRows.map((subject) => ({
        name: subject.name,
        currentMark: subject.currentMark,
        targetMark: subject.targetMark
      }))
    };

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/auth/login");
        return;
      }

      await saveLearnerProfile(supabase, data.user, payload);
      router.replace("/dashboard");
    } catch (error) {
      setMessage(friendlyError(error, "Could not save profile."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Learner Onboarding" eyebrow="Profile setup">
        Capture enough context for useful planning while avoiding sensitive data that is not needed for the MVP.
      </PageHeader>
      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-black">Learner details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Grade"><select value={grade} onChange={(event) => setGrade(Number(event.target.value) as 10 | 11 | 12)} className="focus-ring input"><option value={10}>10</option><option value={11}>11</option><option value={12}>12</option></select></Field>
            <Field label="Province"><select value={province} onChange={(event) => setProvince(event.target.value)} className="focus-ring input">{provinces.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="School name optional"><input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="focus-ring input" placeholder="Optional" /></Field>
            <Field label="Home language"><input value={homeLanguage} onChange={(event) => setHomeLanguage(event.target.value)} className="focus-ring input" /></Field>
            <Field label="Internet access"><select value={internetAccessLevel} onChange={(event) => setInternetAccessLevel(event.target.value as InternetAccessLevel)} className="focus-ring input"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></Field>
            <Field label="Exam or goal date"><input value={examDate} onChange={(event) => setExamDate(event.target.value)} className="focus-ring input" type="date" /></Field>
          </div>
          <Field label="Career interests"><input value={careerInterests} onChange={(event) => setCareerInterests(event.target.value)} className="focus-ring input" /></Field>
          <Field label="Preferred study times"><input value={preferredStudyTimes} onChange={(event) => setPreferredStudyTimes(event.target.value)} className="focus-ring input" /></Field>
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
                  <p className="text-sm text-ink/60">{subject.currentMark}% now</p>
                </div>
                <ProgressBar value={subject.currentMark} target={subject.targetMark} />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-bold text-ink/75">Current mark
                    <input className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" type="number" min="0" max="100" value={subject.currentMark} onChange={(event) => updateMark(subject.name, "currentMark", Number(event.target.value), setMarks)} />
                  </label>
                  <label className="text-sm font-bold text-ink/75">Target mark
                    <input className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" type="number" min="0" max="100" value={subject.targetMark} onChange={(event) => updateMark(subject.name, "targetMark", Number(event.target.value), setMarks)} />
                  </label>
                </div>
              </div>
            ))}
          </div>
          {message ? <p className="mt-4 rounded-lg bg-protea/10 p-3 text-sm font-bold text-ink">{message}</p> : null}
          <button disabled={isSaving} className="focus-ring mt-5 w-full rounded-lg bg-veld px-4 py-3 font-black text-white disabled:opacity-60">
            {isSaving ? "Saving profile..." : "Save profile and go to dashboard"}
          </button>
        </Card>
      </form>
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

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function updateMark(
  subjectName: string,
  field: "currentMark" | "targetMark",
  value: number,
  setMarks: React.Dispatch<React.SetStateAction<Record<string, { currentMark: number; targetMark: number }>>>
) {
  setMarks((current) => ({
    ...current,
    [subjectName]: {
      ...current[subjectName],
      [field]: Math.max(0, Math.min(100, value))
    }
  }));
}
