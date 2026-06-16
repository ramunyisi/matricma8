"use client";

import Link from "next/link";
import { BellRing, CalendarDays, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import { calculateAverage, subjectRisk } from "@/lib/aps";
import { formatDate } from "@/lib/utils";

export default function GuardianPage() {
  const { profile, isDemo } = useLearnerProfile();
  const average = calculateAverage(profile.subjects);
  const riskySubjects = profile.subjects.filter((subject) => subjectRisk(subject.currentMark, subject.targetMark) !== "Safe");

  return (
    <AppShell>
      <PageHeader title="Guardian View" eyebrow={isDemo ? "Demo learner" : "Linked learner"}>
        Monitor study progress, upcoming deadlines, reminder settings, and consent-sensitive account details.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-black">Learner snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Average" value={`${average}%`} />
            <Metric label="Grade" value={String(profile.grade)} />
            <Metric label="Risk subjects" value={String(riskySubjects.length)} />
            <Metric label="Goal date" value={profile.examDate ? formatDate(profile.examDate) : "Not set"} />
          </div>
          <div className="mt-4 rounded-lg bg-veld/5 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-veld" size={18} />
              <p className="font-black">Consent checklist</p>
            </div>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/70">
              <li>- Confirm WhatsApp reminder opt-in belongs to the learner or guardian.</li>
              <li>- Keep bursary documents and ID details outside the app unless required.</li>
              <li>- Verify all university and bursary links on official pages.</li>
            </ul>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Subject support</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {profile.subjects.map((subject) => {
              const risk = subjectRisk(subject.currentMark, subject.targetMark);
              return (
                <div key={subject.id} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black">{subject.name}</p>
                    <Badge tone={risk === "Safe" ? "safe" : risk === "Watch" ? "watch" : "risk"}>{risk}</Badge>
                  </div>
                  <ProgressBar value={subject.currentMark} target={subject.targetMark} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><BellRing size={20} /> Reminder settings</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Study reminders are {profile.whatsappStudyReminders ? "on" : "off"} and bursary deadline reminders are {profile.whatsappDeadlineReminders ? "on" : "off"}.
          </p>
          <Link href="/notifications" className="mt-4 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">Review reminders</Link>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays size={20} /> Next actions</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
            <li>- Check one weak subject with the learner this week.</li>
            <li>- Review saved bursaries and required documents.</li>
            <li>- Update the exam date if the school timetable changes.</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-chalk p-3"><p className="text-xs font-bold uppercase tracking-wide text-ink/55">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}
