"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
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
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [whatsappStudyReminders, setWhatsappStudyReminders] = useState(true);
  const [whatsappDeadlineReminders, setWhatsappDeadlineReminders] = useState(true);
  const [careerInterests, setCareerInterests] = useState("Engineering, data science, commerce");
  const [preferredStudyTimes, setPreferredStudyTimes] = useState("Weekday evenings, Saturday morning");
  const [pendingSubject, setPendingSubject] = useState(sampleSubjects[0]);
  const [marks, setMarks] = useState<Record<string, { currentMark: number; targetMark: number }>>(
    Object.fromEntries(sampleSubjects.map((subject, index) => [subject, { currentMark: 45 + index * 2, targetMark: 65 }]))
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const subjectRows = useMemo(() => selected.map((name) => ({ name, ...marks[name] })), [selected, marks]);
  const availableSubjects = useMemo(() => sampleSubjects.filter((subject) => !selected.includes(subject)), [selected]);

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
      whatsappPhone,
      whatsappOptIn,
      whatsappStudyReminders,
      whatsappDeadlineReminders,
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
      const message = friendlyError(error, "Could not save profile.");
      setMessage(message);
      if (isStaleAuthSessionError(error)) {
        await getSupabaseBrowserClient()?.auth.signOut();
        router.replace("/auth/login");
      }
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
          <div className="mt-4 rounded-lg border border-ink/10 p-4">
            <p className="text-sm font-black">WhatsApp reminders</p>
            <p className="mt-1 text-xs leading-5 text-ink/60">Add a South African number in international format, for example +27 82 123 4567. If enabled, MatricSA can send study and deadline reminders.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="WhatsApp number"><input value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} className="focus-ring input" placeholder="+27..." /></Field>
              <Field label="WhatsApp opt-in">
                <select value={String(whatsappOptIn)} onChange={(event) => setWhatsappOptIn(event.target.value === "true")} className="focus-ring input">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm font-bold text-ink/75">
                <input type="checkbox" checked={whatsappStudyReminders} onChange={(event) => setWhatsappStudyReminders(event.target.checked)} />
                Send study reminders
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-ink/75">
                <input type="checkbox" checked={whatsappDeadlineReminders} onChange={(event) => setWhatsappDeadlineReminders(event.target.checked)} />
                Send deadline reminders
              </label>
            </div>
          </div>
          <Field label="Career interests"><input value={careerInterests} onChange={(event) => setCareerInterests(event.target.value)} className="focus-ring input" /></Field>
          <Field label="Preferred study times"><input value={preferredStudyTimes} onChange={(event) => setPreferredStudyTimes(event.target.value)} className="focus-ring input" /></Field>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Subjects and marks</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-sm font-bold text-ink/80">
              Add a subject from the DBE list
              <select className="input mt-2" value={pendingSubject} onChange={(event) => setPendingSubject(event.target.value)}>
                {availableSubjects.length === 0 ? <option value="">No subjects left to add</option> : null}
                {availableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </label>
            <button
              type="button"
              disabled={!pendingSubject || availableSubjects.length === 0}
              onClick={() => {
                if (!pendingSubject || selected.includes(pendingSubject)) return;
                setSelected((current) => [...current, pendingSubject]);
                setMarks((current) => ({ ...current, [pendingSubject]: current[pendingSubject] ?? { currentMark: 50, targetMark: 65 } }));
                setPendingSubject(availableSubjects.find((subject) => subject !== pendingSubject) ?? availableSubjects[0] ?? "");
              }}
              className="focus-ring h-12 self-end rounded-lg bg-ink px-4 text-sm font-black text-white disabled:opacity-60"
            >
              Add subject
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-ink/55">
            The list is based on DBE past-paper subjects and common NSC subject names. Add only the subjects the learner actually takes.
          </p>
          <div className="mt-5 space-y-4">
            {subjectRows.map((subject) => (
              <div key={subject.name} className="rounded-lg border border-ink/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">{subject.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected((current) => current.filter((item) => item !== subject.name));
                      setMarks((current) => {
                        const next = { ...current };
                        delete next[subject.name];
                        return next;
                      });
                    }}
                    className="focus-ring inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2 py-1 text-xs font-black text-ink/65"
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink/60">{subject.currentMark}% now</p>
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
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-4 block text-sm font-bold text-ink/80">{label}<span className="mt-2 block">{children}</span></label>;
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isStaleAuthSessionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const lower = message.toLowerCase();
  return lower.includes("learner_profiles_user_id_fkey") || lower.includes("violates foreign key constraint");
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
