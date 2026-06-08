"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { calculateAps, calculateAverage, estimateFinalMark, evaluateApsRule, simulateWhatIf, subjectRisk } from "@/lib/aps";
import { loadApsRules } from "@/lib/content-data";
import { updateLearnerSubjectMarks } from "@/lib/learner-profile";
import { matchProgrammes } from "@/lib/programme-matches";
import { programmeRules } from "@/lib/programme-rules";
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
  const programmeMatches = useMemo(() => matchProgrammes(subjects, rules), [subjects, rules]);

  useEffect(() => {
    if (profile.subjects.length === 0) return;
    setSubjects(profile.subjects);
    setWhatIfSubject(profile.subjects[0].name);
  }, [profile]);

  useEffect(() => {
    async function loadRules() {
      const loadedRules = await loadApsRules(getSupabaseBrowserClient());
      const combinedRules = mergeRules(loadedRules, programmeRules);
      setRules(combinedRules);
      setSelectedRuleId(combinedRules[0]?.id ?? sampleApsRules[0].id);
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
      <PageHeader title="Course Match APS Calculator" eyebrow={isDemo ? "Using demo marks" : "Using your saved profile"}>
        Enter your marks to see which university programmes you may qualify for. Matches are estimates and must be checked against official university requirements.
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
            <h2 className="text-xl font-black">Your APS summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Current average" value={`${calculateAverage(subjects)}%`} />
              <Metric label="APS estimate" value={String(calculateAps(subjects, selectedRule))} />
            </div>
            <p className="mt-4 rounded-lg bg-chalk p-3 text-sm font-semibold leading-6 text-ink/65">
              This APS uses common NSC levels and excludes Life Orientation. Programme matches below also check stored minimum subjects where available.
            </p>
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
      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Courses you may qualify for</h2>
            <p className="mt-1 text-sm text-ink/65">{programmeMatches.length} programme rules checked across universities.</p>
          </div>
          <Badge tone="sample">Estimate only</Badge>
        </div>
        <p className="mt-3 rounded-lg bg-chalk p-3 text-sm font-semibold leading-6 text-ink/70">
          For UCT, UP, and NWU we also show prospectus context from the official undergraduate prospectuses so the match card includes the local APS method, closing-date context, and selection notes where available.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {programmeMatches.map((match) => (
            <div key={match.rule.id} className="rounded-lg border border-ink/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink/55">{match.rule.institutionName}</p>
                  <h3 className="mt-1 text-lg font-black">{match.rule.programmeName}</h3>
                </div>
                <Badge tone={match.prediction.eligibilityStatus === "Likely qualifies" ? "safe" : match.prediction.eligibilityStatus === "Watch requirements" ? "watch" : "risk"}>
                  {match.prediction.eligibilityStatus}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Info label="Required APS" value={String(match.rule.ruleJson.minimumTotal ?? "Check source")} />
                <Info label="Your gap" value={match.apsGap >= 0 ? `+${match.apsGap}` : String(match.apsGap)} />
              </div>
              {match.missingSubjects.length > 0 || match.belowMinimumSubjects.length > 0 ? (
                <p className="mt-3 rounded-lg bg-protea/10 p-3 text-sm font-semibold leading-6 text-ink/75">
                  Watch: {match.missingSubjects.concat(match.belowMinimumSubjects).join(", ")}
                </p>
              ) : (
                <p className="mt-3 rounded-lg bg-veld/10 p-3 text-sm font-semibold text-ink/75">Subject minimums in our stored rule are met.</p>
              )}
              {match.rule.prospectusNotes?.length ? (
                <div className="mt-3 rounded-lg border border-veld/15 bg-veld/5 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-veld">Prospectus context</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/75">
                    {match.rule.prospectusNotes.map((note) => (
                      <li key={note}>- {note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={match.rule.sourceUrl} target="_blank" className="focus-ring inline-flex rounded-lg border border-ink/15 px-3 py-2 text-sm font-black text-ink">
                  Verify official requirements
                </a>
                {match.rule.prospectusUrl ? (
                  <a href={match.rule.prospectusUrl} target="_blank" className="focus-ring inline-flex rounded-lg border border-veld/20 bg-veld/5 px-3 py-2 text-sm font-black text-veld">
                    Open prospectus
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

function mergeRules(primary: ApsRule[], fallback: ApsRule[]) {
  const merged = new Map<string, ApsRule>();
  for (const rule of fallback) merged.set(`${rule.institutionName}|${rule.programmeName}`, rule);
  for (const rule of primary) merged.set(`${rule.institutionName}|${rule.programmeName}`, rule);
  return Array.from(merged.values());
}

function updateSubject(id: string, field: "currentMark" | "targetMark", value: number, setSubjects: React.Dispatch<React.SetStateAction<LearnerSubject[]>>) {
  setSubjects((current) => current.map((subject) => subject.id === id ? { ...subject, [field]: Math.max(0, Math.min(100, value)) } : subject));
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-chalk p-4"><p className="text-sm font-bold text-ink/60">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-chalk p-3"><p className="text-xs font-bold text-ink/55">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}
