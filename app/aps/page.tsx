"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { calculateAps, calculateAverage, estimateFinalMark, evaluateApsRule, simulateWhatIf, subjectRisk } from "@/lib/aps";
import { loadApsRules } from "@/lib/content-data";
import { updateLearnerSubjectMarks } from "@/lib/learner-profile";
import { demoProfile, sampleApsRules } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import type { ApsRule, LearnerSubject } from "@/lib/types";
import { friendlyError } from "@/lib/utils";

export default function ApsPage() {
  const { profile, isDemo } = useLearnerProfile();
  const [subjects, setSubjects] = useState<LearnerSubject[]>(demoProfile.subjects);
  const [whatIfSubject, setWhatIfSubject] = useState(subjects[0].name);
  const [whatIfMark, setWhatIfMark] = useState(60);
  const [rules, setRules] = useState<ApsRule[]>(sampleApsRules);
  const [selectedRuleId, setSelectedRuleId] = useState(sampleApsRules[0].id);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];
  const prediction = evaluateApsRule(subjects, selectedRule);
  const simulation = useMemo(() => simulateWhatIf(subjects, whatIfSubject, whatIfMark, selectedRule), [subjects, whatIfSubject, whatIfMark, selectedRule]);

  useEffect(() => {
    if (profile.subjects.length === 0) return;
    setSubjects(profile.subjects);
    setWhatIfSubject(profile.subjects[0].name);
  }, [profile]);

  useEffect(() => {
    async function loadRules() {
      const loadedRules = await loadApsRules(getSupabaseBrowserClient());
      setRules(loadedRules);
      setSelectedRuleId(loadedRules[0]?.id ?? sampleApsRules[0].id);
    }

    loadRules();
  }, []);

  async function saveMarks() {
    setIsSaving(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || isDemo) {
        setMessage("Demo mode: marks changed locally only.");
        return;
      }
      await updateLearnerSubjectMarks(supabase, profile.id, subjects);
      setMessage("Marks saved to your learner profile and mark history.");
    } catch (error) {
      setMessage(friendlyError(error, "Could not save marks."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Matric / APS Predictor" eyebrow={isDemo ? "Configurable sample rules" : "Your saved profile"}>
        APS rules differ by institution and programme. This MVP stores rules as JSON and labels sample data clearly.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">Marks input</h2>
            <button onClick={saveMarks} disabled={isSaving} className="focus-ring rounded-lg bg-veld px-4 py-2 text-sm font-black text-white disabled:opacity-60">
              {isSaving ? "Saving..." : "Save marks"}
            </button>
          </div>
          {message ? <p className="mt-3 rounded-lg bg-chalk p-3 text-sm font-bold text-ink/75">{message}</p> : null}
          <div className="mt-4 space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="rounded-lg border border-ink/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{subject.name}</p>
                  <Badge tone={subjectRisk(subject.currentMark, subject.targetMark) === "Safe" ? "safe" : subjectRisk(subject.currentMark, subject.targetMark) === "Watch" ? "watch" : "risk"}>
                    {subjectRisk(subject.currentMark, subject.targetMark)}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-bold">Current mark
                    <input className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" type="number" min="0" max="100" value={subject.currentMark} onChange={(event) => updateSubject(subject.id, "currentMark", Number(event.target.value), setSubjects)} />
                  </label>
                  <label className="text-sm font-bold">Target mark
                    <input className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" type="number" min="0" max="100" value={subject.targetMark} onChange={(event) => updateSubject(subject.id, "targetMark", Number(event.target.value), setSubjects)} />
                  </label>
                </div>
                <div className="mt-3">
                  <ProgressBar value={subject.currentMark} target={subject.targetMark} />
                  <p className="mt-2 text-xs text-ink/60">Estimated final mark: {estimateFinalMark(subject.currentMark, subject.targetMark)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Prediction</h2>
              <Badge tone="sample">{selectedRule.sampleData ? "Sample APS rule" : "Stored APS rule"}</Badge>
            </div>
            <label className="mt-4 block text-sm font-bold">Institution programme
              <select className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" value={selectedRuleId} onChange={(event) => setSelectedRuleId(event.target.value)}>
                {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.institutionName} - {rule.programmeName}</option>)}
              </select>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Current average" value={`${calculateAverage(subjects)}%`} />
              <Metric label="APS estimate" value={String(calculateAps(subjects, selectedRule))} />
            </div>
            <p className="mt-4 font-bold">{selectedRule.institutionName}: {selectedRule.programmeName}</p>
            <Badge tone={prediction.eligibilityStatus === "Likely qualifies" ? "safe" : prediction.eligibilityStatus === "Watch requirements" ? "watch" : "risk"}>{prediction.eligibilityStatus}</Badge>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/70">
              {prediction.explanation.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Card>
          <Card>
            <h2 className="text-xl font-black">What if simulator</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold">Subject
                <select className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" value={whatIfSubject} onChange={(event) => setWhatIfSubject(event.target.value)}>
                  {subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold">New mark
                <input className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2" type="number" min="0" max="100" value={whatIfMark} onChange={(event) => setWhatIfMark(Number(event.target.value))} />
              </label>
            </div>
            <p className="mt-4 rounded-lg bg-chalk p-3 text-sm font-bold">APS changes from {simulation.before} to {simulation.after}.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function updateSubject(id: string, field: "currentMark" | "targetMark", value: number, setSubjects: React.Dispatch<React.SetStateAction<LearnerSubject[]>>) {
  setSubjects((current) => current.map((subject) => subject.id === id ? { ...subject, [field]: Math.max(0, Math.min(100, value)) } : subject));
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-chalk p-4"><p className="text-sm font-bold text-ink/60">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>;
}
