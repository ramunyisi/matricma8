"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, ProgressBar } from "@/components/ui";
import { getCurrentUser, saveLearnerProfile } from "@/lib/learner-profile";
import { sampleSubjects, provinces } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { InternetAccessLevel } from "@/lib/types";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import { friendlyError } from "@/lib/utils";

export default function ProfilePage() {
  const { profile, isDemo, isLoading } = useLearnerProfile();
  const [selected, setSelected] = useState<string[]>([]);
  const [grade, setGrade] = useState<10 | 11 | 12>(12);
  const [province, setProvince] = useState("Gauteng");
  const [schoolName, setSchoolName] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("English");
  const [internetAccessLevel, setInternetAccessLevel] = useState<InternetAccessLevel>("medium");
  const [examDate, setExamDate] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [whatsappStudyReminders, setWhatsappStudyReminders] = useState(false);
  const [whatsappDeadlineReminders, setWhatsappDeadlineReminders] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [fallbackEmailEnabled, setFallbackEmailEnabled] = useState(false);
  const [reminderTimezone, setReminderTimezone] = useState("Africa/Johannesburg");
  const [reminderPausedUntil, setReminderPausedUntil] = useState("");
  const [studyReminderHour, setStudyReminderHour] = useState(18);
  const [deadlineReminderHour, setDeadlineReminderHour] = useState(10);
  const [quietHoursStart, setQuietHoursStart] = useState(20);
  const [quietHoursEnd, setQuietHoursEnd] = useState(6);
  const [careerInterests, setCareerInterests] = useState("");
  const [preferredStudyTimes, setPreferredStudyTimes] = useState("");
  const [pendingSubject, setPendingSubject] = useState(sampleSubjects[0]);
  const [marks, setMarks] = useState<Record<string, { currentMark: number; targetMark: number }>>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelected(profile.subjects.map((subject) => subject.name));
    setGrade(profile.grade);
    setProvince(profile.province);
    setSchoolName(profile.schoolName ?? "");
    setHomeLanguage(profile.homeLanguage);
    setInternetAccessLevel(profile.internetAccessLevel);
    setExamDate(profile.examDate);
    setWhatsappPhone(profile.whatsappPhone ?? "");
    setWhatsappOptIn(Boolean(profile.whatsappOptIn));
    setWhatsappStudyReminders(Boolean(profile.whatsappStudyReminders));
    setWhatsappDeadlineReminders(Boolean(profile.whatsappDeadlineReminders));
    setReminderEmail(profile.reminderEmail ?? "");
    setFallbackEmailEnabled(Boolean(profile.fallbackEmailEnabled));
    setReminderTimezone(profile.reminderTimezone ?? "Africa/Johannesburg");
    setReminderPausedUntil(profile.reminderPausedUntil ?? "");
    setStudyReminderHour(profile.studyReminderHour ?? 18);
    setDeadlineReminderHour(profile.deadlineReminderHour ?? 10);
    setQuietHoursStart(profile.quietHoursStart ?? 20);
    setQuietHoursEnd(profile.quietHoursEnd ?? 6);
    setCareerInterests(profile.careerInterests.join(", "));
    setPreferredStudyTimes(profile.preferredStudyTimes.join(", "));
    setMarks(Object.fromEntries(profile.subjects.map((subject) => [subject.name, { currentMark: subject.currentMark, targetMark: subject.targetMark }])));
  }, [profile]);

  const subjectRows = useMemo(() => selected.map((name) => ({ name, currentMark: marks[name]?.currentMark ?? 50, targetMark: marks[name]?.targetMark ?? 65 })), [selected, marks]);
  const availableSubjects = useMemo(() => sampleSubjects.filter((subject) => !selected.includes(subject)), [selected]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || isDemo) {
        setMessage("Demo mode: profile changes are local only.");
        return;
      }
      const user = await getCurrentUser(supabase);
      if (!user) throw new Error("Login required.");
      await saveLearnerProfile(supabase, user, {
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
        reminderEmail,
        fallbackEmailEnabled,
        reminderTimezone,
        reminderPausedUntil,
        studyReminderHour,
        deadlineReminderHour,
        quietHoursStart,
        quietHoursEnd,
        careerInterests: splitList(careerInterests),
        preferredStudyTimes: splitList(preferredStudyTimes),
        subjects: subjectRows
      });
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(friendlyError(error, "Could not save profile."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Profile" eyebrow="Account settings">
        Update grade, province, subject marks, career interests, study times, and internet access.
      </PageHeader>
      {isLoading ? <Card className="mb-4">Loading profile...</Card> : null}
      {message ? <Card className="mb-4">{message}</Card> : null}
      <form onSubmit={saveProfile} className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-black">Learner details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Grade"><select value={grade} onChange={(event) => setGrade(Number(event.target.value) as 10 | 11 | 12)} className="input"><option value={10}>10</option><option value={11}>11</option><option value={12}>12</option></select></Field>
            <Field label="Province"><select value={province} onChange={(event) => setProvince(event.target.value)} className="input">{provinces.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="School name optional"><input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="input" /></Field>
            <Field label="Home language"><input value={homeLanguage} onChange={(event) => setHomeLanguage(event.target.value)} className="input" /></Field>
            <Field label="Internet access"><select value={internetAccessLevel} onChange={(event) => setInternetAccessLevel(event.target.value as InternetAccessLevel)} className="input"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></Field>
            <Field label="Exam or goal date"><input value={examDate} onChange={(event) => setExamDate(event.target.value)} className="input" type="date" /></Field>
          </div>
          <div className="mt-4 rounded-lg border border-ink/10 p-4">
            <p className="text-sm font-black">WhatsApp reminders</p>
            <p className="mt-1 text-xs leading-5 text-ink/60">These settings control whether MatricSA can send study and bursary deadline reminders to your phone.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="WhatsApp number"><input value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} className="input" placeholder="+27..." /></Field>
              <Field label="WhatsApp opt-in">
                <select value={String(whatsappOptIn)} onChange={(event) => setWhatsappOptIn(event.target.value === "true")} className="input">
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
          <div className="mt-4 rounded-lg border border-ink/10 p-4">
            <p className="text-sm font-black">Reminder settings</p>
            <p className="mt-1 text-xs leading-5 text-ink/60">Use the dedicated notifications page to manage time, quiet hours, email fallback, and pause/resume controls.</p>
            <Link href="/notifications" className="mt-3 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">Open reminder settings</Link>
          </div>
          <Field label="Career interests"><input value={careerInterests} onChange={(event) => setCareerInterests(event.target.value)} className="input" /></Field>
          <Field label="Preferred study times"><input value={preferredStudyTimes} onChange={(event) => setPreferredStudyTimes(event.target.value)} className="input" /></Field>
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
                <p className="text-sm text-ink/60">{subject.currentMark}% now</p>
                <ProgressBar value={subject.currentMark} target={subject.targetMark} />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Current mark"><input className="input" type="number" min="0" max="100" value={subject.currentMark} onChange={(event) => updateMark(subject.name, "currentMark", Number(event.target.value), setMarks)} /></Field>
                  <Field label="Target mark"><input className="input" type="number" min="0" max="100" value={subject.targetMark} onChange={(event) => updateMark(subject.name, "targetMark", Number(event.target.value), setMarks)} /></Field>
                </div>
              </div>
            ))}
          </div>
          <button disabled={isSaving} className="focus-ring mt-5 w-full rounded-lg bg-veld px-4 py-3 font-black text-white disabled:opacity-60">
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </Card>
      </form>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-ink/80">{label}{children}</label>;
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function updateMark(subjectName: string, field: "currentMark" | "targetMark", value: number, setMarks: React.Dispatch<React.SetStateAction<Record<string, { currentMark: number; targetMark: number }>>>) {
  setMarks((current) => ({
    ...current,
    [subjectName]: {
      ...current[subjectName],
      [field]: Math.max(0, Math.min(100, value))
    }
  }));
}
