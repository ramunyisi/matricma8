"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Bookmark,
  BookmarkCheck,
  ClipboardCheck,
  Compass,
  GitCompare,
  GraduationCap,
  LineChart,
  MessageSquareText,
  Route,
  Search,
  SlidersHorizontal,
  Target,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { nscLevel } from "@/lib/aps";
import { careerPaths, type CareerPath } from "@/lib/career-paths";
import { useLearnerProfile } from "@/lib/use-learner-profile";

type LearnerSubjectLike = {
  name: string;
  currentMark: number;
  targetMark: number;
};

type PathFit = {
  path: CareerPath;
  score: number;
  subjectScore: number;
  markScore: number;
  interestScore: number;
  matchedSubjects: string[];
  missingSubjects: string[];
  averageMarkGap: number;
  reasons: string[];
};

const storageKeys = {
  savedPaths: "matricsa-saved-career-paths",
  checklist: "matricsa-career-path-checklist"
};

const checklistItems = [
  "Confirm subject requirements",
  "Check APS calculator",
  "Compare universities",
  "Practise weakest subject",
  "Save matching bursaries",
  "Discuss with teacher or guardian"
];

const gradeMilestones = [
  {
    grade: "Grade 10",
    title: "Keep options open",
    text: "Protect the subjects that unlock the pathway and build a stable study rhythm before Grade 11 marks become important."
  },
  {
    grade: "Grade 11",
    title: "Build application evidence",
    text: "Push core subjects into the target range, compare prospectus rules, and start collecting bursary and programme options."
  },
  {
    grade: "Grade 12",
    title: "Apply and prove readiness",
    text: "Use past papers, final APS checks, and deadline tracking to move from interest into applications."
  }
];

export default function PathwaysPage() {
  const { profile, isDemo } = useLearnerProfile();
  const [pathId, setPathId] = useState(careerPaths[0].id);
  const [comparePathId, setComparePathId] = useState(careerPaths[1]?.id ?? careerPaths[0].id);
  const [query, setQuery] = useState("");
  const [savedPathIds, setSavedPathIds] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<Record<string, Record<string, boolean>>>({});
  const [simulatedMarks, setSimulatedMarks] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedPaths = window.localStorage.getItem(storageKeys.savedPaths);
      const savedChecklist = window.localStorage.getItem(storageKeys.checklist);
      if (savedPaths) setSavedPathIds(JSON.parse(savedPaths));
      if (savedChecklist) setChecklist(JSON.parse(savedChecklist));
    } catch {
      // Ignore invalid local storage values.
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKeys.savedPaths, JSON.stringify(savedPathIds));
  }, [isHydrated, savedPathIds]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKeys.checklist, JSON.stringify(checklist));
  }, [checklist, isHydrated]);

  const pathFits = useMemo(
    () => careerPaths.map((path) => scorePath(path, profile.subjects, profile.careerInterests)),
    [profile.careerInterests, profile.subjects]
  );
  const recommended = pathFits.slice().sort((a, b) => b.score - a.score)[0] ?? pathFits[0];
  const selectedFit = pathFits.find((fit) => fit.path.id === pathId) ?? recommended ?? pathFits[0];
  const compareFit = pathFits.find((fit) => fit.path.id === comparePathId) ?? pathFits.find((fit) => fit.path.id !== selectedFit.path.id) ?? selectedFit;
  const selectedPath = selectedFit.path;
  const estimatedAps = estimateAps(profile.subjects);
  const strongestSubject = profile.subjects.slice().sort((a, b) => b.currentMark - a.currentMark)[0];
  const weakestPathSubject = selectedFit.missingSubjects[0] ?? selectedPath.focusSubjects.find((subject) => {
    const learnerSubject = findLearnerSubject(profile.subjects, subject);
    return learnerSubject && learnerSubject.currentMark < learnerSubject.targetMark;
  }) ?? selectedPath.focusSubjects[0];
  const subjectWarnings = buildSubjectWarnings(selectedFit, profile.grade);
  const simulatedSubjects = applySimulatedMarks(profile.subjects, simulatedMarks);
  const simulatedFit = scorePath(selectedPath, simulatedSubjects, profile.careerInterests);
  const savedPaths = savedPathIds
    .map((id) => pathFits.find((fit) => fit.path.id === id))
    .filter((fit): fit is PathFit => Boolean(fit));
  const filteredFits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return pathFits;
    return pathFits.filter((fit) =>
      [
        fit.path.title,
        fit.path.summary,
        fit.path.focusSubjects.join(" "),
        fit.path.interestKeywords?.join(" ") ?? "",
        fit.path.bursaryFields?.join(" ") ?? "",
        fit.path.programmeExamples.map((programme) => `${programme.institution} ${programme.programme}`).join(" ")
      ].join(" ").toLowerCase().includes(needle)
    );
  }, [pathFits, query]);
  const discussionSummary = buildDiscussionSummary(selectedFit, profile.grade, estimatedAps, weakestPathSubject);

  return (
    <AppShell>
      <PageHeader title="Career-path Planner" eyebrow={isDemo ? "Demo profile" : `${profile.grade} learner profile`}>
        Compare South African study routes against your current subjects, mark gaps, APS benchmarks, bursaries, and next actions.
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Metric icon={<Target size={18} />} label="Best fit" value={`${recommended?.score ?? 0}%`} sub={recommended?.path.title ?? "No pathway"} tone="safe" />
        <Metric icon={<LineChart size={18} />} label="Estimated APS" value={String(estimatedAps)} sub="common NSC estimate" tone={estimatedAps >= 30 ? "safe" : estimatedAps >= 24 ? "watch" : "risk"} />
        <Metric icon={<GraduationCap size={18} />} label="APS range" value={programmeApsRange(selectedPath)} sub="shown programmes" tone="watch" />
        <Metric icon={<BookOpenCheck size={18} />} label="Matched subjects" value={`${selectedFit.matchedSubjects.length}/${selectedPath.focusSubjects.length}`} sub="for selected path" tone="sample" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2">
              <Search className="text-veld" size={18} />
              <h2 className="text-xl font-black">Explore pathways</h2>
            </div>
            <label className="mt-4 block text-sm font-bold">
              Search route, subject, bursary field, or university
              <input
                className="input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Engineering, Nursing, TVET, Accounting..."
              />
            </label>
            <div className="mt-4 grid gap-2">
              {filteredFits.map((fit) => {
                const isActive = fit.path.id === selectedPath.id;
                const isSaved = savedPathIds.includes(fit.path.id);
                return (
                  <button
                    key={fit.path.id}
                    type="button"
                    onClick={() => setPathId(fit.path.id)}
                    className={`focus-ring rounded-lg border p-3 text-left transition ${isActive ? "border-veld bg-veld/5" : "border-ink/10 bg-white hover:bg-chalk"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{fit.path.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink/60">{fit.path.summary}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={fit.score >= 70 ? "safe" : fit.score >= 45 ? "watch" : "risk"}>{fit.score}%</Badge>
                        {isSaved ? <BookmarkCheck size={16} className="text-veld" /> : null}
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-veld" style={{ width: `${fit.score}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-xl font-black"><Compass className="text-veld" size={20} /> Recommended route</h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              {recommended?.path.title ?? "Complete your profile to unlock a recommendation."}
            </p>
            <div className="mt-4 rounded-lg bg-chalk p-3">
              <p className="text-xs font-black uppercase tracking-wide text-ink/55">Why it ranks first</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/70">
                <li>- {recommended?.matchedSubjects.length ?? 0} focus subjects already appear in your profile.</li>
                <li>- Interest match contributes {recommended?.interestScore ?? 0} points.</li>
                <li>- Strongest current subject: {strongestSubject?.name ?? "not available"}.</li>
              </ul>
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-xl font-black"><Bookmark className="text-sky" size={20} /> Saved pathways</h2>
            {savedPaths.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {savedPaths.map((fit) => (
                  <button key={fit.path.id} type="button" onClick={() => setPathId(fit.path.id)} className="rounded-lg bg-chalk p-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{fit.path.title}</p>
                      <Badge tone="safe">{fit.score}%</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink/65">Save two or three routes to keep comparing them as marks improve.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink/55">Selected route</p>
                <h2 className="mt-1 text-3xl font-black leading-tight">{selectedPath.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={selectedFit.score >= 70 ? "safe" : selectedFit.score >= 45 ? "watch" : "risk"}>{selectedFit.score}% fit</Badge>
                <Badge tone={confidenceTone(selectedPath.sourceConfidence ?? "sample")}>{confidenceLabel(selectedPath.sourceConfidence ?? "sample")}</Badge>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/70">{selectedPath.summary}</p>

            {subjectWarnings.length > 0 ? (
              <div className="mt-4 rounded-lg border border-protea/20 bg-protea/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 text-protea" size={18} />
                  <div>
                    <p className="font-black">Subject choice warning</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/75">
                      {subjectWarnings.map((warning) => <li key={warning}>- {warning}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {selectedPath.focusSubjects.map((subject) => {
                const learnerSubject = findLearnerSubject(profile.subjects, subject);
                return (
                  <div key={subject} className="rounded-lg border border-ink/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{subject}</p>
                        <p className="mt-1 text-xs font-semibold text-ink/55">
                          {learnerSubject ? `${learnerSubject.currentMark}% now · target ${learnerSubject.targetMark}%` : "Not in current subjects"}
                        </p>
                      </div>
                      <Badge tone={learnerSubject ? "safe" : "risk"}>{learnerSubject ? "Matched" : "Gap"}</Badge>
                    </div>
                    {learnerSubject ? <ProgressBar value={learnerSubject.currentMark} target={learnerSubject.targetMark} /> : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleSavedPath(selectedPath.id, setSavedPathIds)}
                className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white"
              >
                {savedPathIds.includes(selectedPath.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {savedPathIds.includes(selectedPath.id) ? "Saved" : "Save pathway"}
              </button>
              <Link href={buildApsHref(selectedPath)} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2 text-sm font-black text-ink">
                APS calculator <ArrowRight size={16} />
              </Link>
              <Link href={buildUniversitiesHref(selectedPath)} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2 text-sm font-black text-ink">
                Universities
              </Link>
              <Link
                href={buildCoachHref(weakestPathSubject, selectedPath.title)}
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-veld/20 bg-veld/5 px-4 py-2 text-sm font-black text-veld"
              >
                Practise route subject
              </Link>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <ScoreExplanation fit={selectedFit} />
            <PathChecklist pathId={selectedPath.id} checklist={checklist} setChecklist={setChecklist} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <ComparisonCard selectedFit={selectedFit} compareFit={compareFit} setComparePathId={setComparePathId} />
            <SimulatorCard selectedPath={selectedPath} subjects={profile.subjects} simulatedMarks={simulatedMarks} simulatedFit={simulatedFit} originalFit={selectedFit} setSimulatedMarks={setSimulatedMarks} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <BursaryTieIn path={selectedPath} />
            <DiscussionSummary summary={discussionSummary} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <h2 className="flex items-center gap-2 text-xl font-black"><Route className="text-veld" size={20} /> Grade-by-grade plan</h2>
              <div className="mt-4 space-y-3">
                {gradeMilestones.map((milestone) => (
                  <div key={milestone.grade} className="rounded-lg border border-ink/10 p-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-veld/10 text-sm font-black text-veld">
                        {milestone.grade.replace("Grade ", "G")}
                      </div>
                      <div>
                        <p className="font-black">{milestone.title}</p>
                        <p className="mt-1 text-sm leading-6 text-ink/70">{milestone.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 text-xl font-black"><TrendingUp className="text-sky" size={20} /> Mark targets</h2>
              <GradeBlock grade={selectedPath.gradeTargets.grade} marks={selectedPath.gradeTargets.marks} />
              <div className="mt-4 rounded-lg bg-chalk p-3 text-sm leading-6 text-ink/70">
                {selectedFit.averageMarkGap > 0
                  ? `Aim to lift pathway subjects by about ${selectedFit.averageMarkGap}% on average before applications.`
                  : "Your matched pathway subjects are at or above their saved targets. Keep them stable with weekly revision."}
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink/55">University examples from prospectuses</p>
                <h2 className="mt-1 text-2xl font-black">Where this pathway leads</h2>
              </div>
              <GraduationCap className="text-veld" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {selectedPath.programmeExamples.map((programme) => (
                <div key={`${programme.institution}-${programme.programme}`} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink/55">{programme.institution}</p>
                      <h3 className="mt-1 text-lg font-black">{programme.programme}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={programme.aps <= estimatedAps ? "safe" : programme.aps <= estimatedAps + 6 ? "watch" : "risk"}>APS {programme.aps}</Badge>
                      <Badge tone={confidenceTone(programme.sourceStatus ?? selectedPath.sourceConfidence ?? "sample")}>
                        {confidenceLabel(programme.sourceStatus ?? selectedPath.sourceConfidence ?? "sample")}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{programme.note}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={buildUniversitiesHref(selectedPath, programme.institution)} className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-xs font-black">
                      Find institution
                    </Link>
                    <Link href={buildApsHref(selectedPath, programme.programme)} className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-xs font-black">
                      Check APS
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function scorePath(path: CareerPath, subjects: LearnerSubjectLike[], interests: string[] = []): PathFit {
  const matchedSubjects = path.focusSubjects.filter((subject) => Boolean(findLearnerSubject(subjects, subject)));
  const missingSubjects = path.focusSubjects.filter((subject) => !findLearnerSubject(subjects, subject));
  const subjectScore = Math.round((matchedSubjects.length / path.focusSubjects.length) * 50);
  const markScore = Math.round(
    matchedSubjects.reduce((sum, subject) => {
      const learnerSubject = findLearnerSubject(subjects, subject);
      return sum + Math.min(1, (learnerSubject?.currentMark ?? 0) / 70);
    }, 0) / Math.max(1, matchedSubjects.length) * 35
  );
  const interestScore = Math.min(15, interestMatchCount(path, interests) * 5);
  const averageMarkGap = Math.round(
    matchedSubjects.reduce((sum, subject) => {
      const learnerSubject = findLearnerSubject(subjects, subject);
      if (!learnerSubject) return sum;
      return sum + Math.max(0, learnerSubject.targetMark - learnerSubject.currentMark);
    }, 0) / Math.max(1, matchedSubjects.length)
  );
  const score = Math.min(100, subjectScore + markScore + interestScore);
  return {
    path,
    score,
    subjectScore,
    markScore,
    interestScore,
    matchedSubjects,
    missingSubjects,
    averageMarkGap,
    reasons: [
      `${matchedSubjects.length}/${path.focusSubjects.length} pathway subjects are in your profile.`,
      `${markScore}/35 points come from current marks in matched subjects.`,
      interestScore > 0 ? `${interestScore}/15 points come from career interests.` : "No career-interest boost yet. Add interests in your profile to improve recommendations.",
      missingSubjects.length > 0 ? `Missing or unmatched subjects: ${missingSubjects.join(", ")}.` : "No focus-subject gaps detected."
    ]
  };
}

function findLearnerSubject(subjects: LearnerSubjectLike[], focusSubject: string) {
  const focus = normalizeSubject(focusSubject);
  return subjects.find((subject) => {
    const current = normalizeSubject(subject.name);
    return focus.includes(current) || current.includes(focus) || focus.split(" ").some((part) => part.length > 4 && current.includes(part));
  });
}

function normalizeSubject(value: string) {
  return value.toLowerCase().replace(/home language|first additional language|\/|and/g, " ").replace(/\s+/g, " ").trim();
}

function estimateAps(subjects: LearnerSubjectLike[]) {
  return subjects
    .filter((subject) => !normalizeSubject(subject.name).includes("life orientation"))
    .map((subject) => nscLevel(subject.currentMark))
    .sort((a, b) => b - a)
    .slice(0, 6)
    .reduce((sum, level) => sum + level, 0);
}

function programmeApsRange(path: CareerPath) {
  const values = path.programmeExamples.map((programme) => programme.aps);
  return `${Math.min(...values)}-${Math.max(...values)}`;
}

function interestMatchCount(path: CareerPath, interests: string[]) {
  const keywords = (path.interestKeywords ?? path.title.split(/\W+/)).map((item) => item.toLowerCase());
  return interests.filter((interest) => {
    const value = interest.toLowerCase();
    return keywords.some((keyword) => value.includes(keyword) || keyword.includes(value));
  }).length;
}

function buildSubjectWarnings(fit: PathFit, grade: 10 | 11 | 12) {
  if (grade === 12) return [];
  const highImpact = fit.missingSubjects.filter((subject) => /mathematics|physical sciences|life sciences|accounting/i.test(subject));
  return highImpact.map((subject) => `${subject} is important for this pathway. Confirm with a teacher before final subject choices close.`);
}

function applySimulatedMarks(subjects: LearnerSubjectLike[], simulatedMarks: Record<string, number>) {
  return subjects.map((subject) => ({
    ...subject,
    currentMark: simulatedMarks[subject.name] ?? subject.currentMark
  }));
}

function toggleSavedPath(pathId: string, setSavedPathIds: React.Dispatch<React.SetStateAction<string[]>>) {
  setSavedPathIds((current) => current.includes(pathId) ? current.filter((id) => id !== pathId) : [...current, pathId]);
}

function buildCoachHref(subject: string, pathway: string) {
  const params = new URLSearchParams({ subject, topic: `${pathway} pathway preparation`, mode: "practice" });
  return `/study-coach?${params.toString()}`;
}

function buildApsHref(path: CareerPath, programme?: string) {
  const params = new URLSearchParams({ pathway: path.id });
  if (programme) params.set("programme", programme);
  return `/aps?${params.toString()}`;
}

function buildUniversitiesHref(path: CareerPath, institution?: string) {
  const params = new URLSearchParams({ query: institution ?? path.programmeExamples[0]?.institution ?? path.title });
  return `/universities?${params.toString()}`;
}

function buildBursaryHref(path: CareerPath) {
  const field = path.bursaryFields?.[0] ?? path.title;
  return `/bursaries?field=${encodeURIComponent(field)}`;
}

function confidenceLabel(value: "verified" | "sample" | "needs_check") {
  if (value === "verified") return "Verified";
  if (value === "needs_check") return "Needs check";
  return "Sample";
}

function confidenceTone(value: "verified" | "sample" | "needs_check") {
  if (value === "verified") return "safe";
  if (value === "needs_check") return "watch";
  return "sample";
}

function buildDiscussionSummary(fit: PathFit, grade: 10 | 11 | 12, estimatedAps: number, weakSubject: string) {
  return [
    `Grade ${grade} learner is exploring ${fit.path.title}.`,
    `Current estimated APS is ${estimatedAps}.`,
    `${fit.matchedSubjects.length}/${fit.path.focusSubjects.length} key subjects are matched.`,
    fit.missingSubjects.length ? `Subject gaps to discuss: ${fit.missingSubjects.join(", ")}.` : "No major subject gaps are visible from the current profile.",
    `Next practical focus: ${weakSubject}.`
  ].join(" ");
}

function GradeBlock({ grade, marks }: { grade: 10 | 11 | 12; marks: string[] }) {
  return (
    <div className="mt-4 rounded-lg border border-ink/10 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-ink/55">{`Grade ${grade} target`}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-ink/75">
        {marks.map((mark) => (
          <li key={mark}>- {mark}</li>
        ))}
      </ul>
    </div>
  );
}

function ScoreExplanation({ fit }: { fit: PathFit }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-black"><LineChart className="text-veld" size={20} /> Fit score</h2>
      <div className="mt-4 grid gap-2 text-sm">
        <ScoreRow label="Subject match" value={fit.subjectScore} max={50} />
        <ScoreRow label="Current marks" value={fit.markScore} max={35} />
        <ScoreRow label="Career interests" value={fit.interestScore} max={15} />
      </div>
      <ul className="mt-4 space-y-1 text-sm leading-6 text-ink/70">
        {fit.reasons.map((reason) => <li key={reason}>- {reason}</li>)}
      </ul>
    </Card>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink/70">{label}</p>
        <p className="font-black">{value}/{max}</p>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-veld" style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function PathChecklist({
  pathId,
  checklist,
  setChecklist
}: {
  pathId: string;
  checklist: Record<string, Record<string, boolean>>;
  setChecklist: React.Dispatch<React.SetStateAction<Record<string, Record<string, boolean>>>>;
}) {
  const values = checklist[pathId] ?? {};
  const completed = checklistItems.filter((item) => values[item]).length;
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-black"><ClipboardCheck className="text-sky" size={20} /> Pathway checklist</h2>
      <p className="mt-2 text-sm font-semibold text-ink/60">{completed}/{checklistItems.length} complete</p>
      <div className="mt-4 space-y-2">
        {checklistItems.map((item) => (
          <label key={item} className="flex items-center gap-2 rounded-lg bg-chalk p-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={Boolean(values[item])}
              onChange={(event) => {
                setChecklist((current) => ({
                  ...current,
                  [pathId]: { ...(current[pathId] ?? {}), [item]: event.target.checked }
                }));
              }}
            />
            {item}
          </label>
        ))}
      </div>
    </Card>
  );
}

function ComparisonCard({
  selectedFit,
  compareFit,
  setComparePathId
}: {
  selectedFit: PathFit;
  compareFit: PathFit;
  setComparePathId: (id: string) => void;
}) {
  const overlap = selectedFit.path.focusSubjects.filter((subject) => compareFit.path.focusSubjects.some((other) => normalizeSubject(other) === normalizeSubject(subject)));
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-black"><GitCompare className="text-veld" size={20} /> Compare pathways</h2>
      <label className="mt-4 block text-sm font-bold">
        Compare with
        <select className="input" value={compareFit.path.id} onChange={(event) => setComparePathId(event.target.value)}>
          {careerPaths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
        </select>
      </label>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CompareColumn fit={selectedFit} />
        <CompareColumn fit={compareFit} />
      </div>
      <div className="mt-4 rounded-lg bg-chalk p-3 text-sm leading-6 text-ink/70">
        Shared subjects: {overlap.length ? overlap.join(", ") : "No direct overlap in the focus-subject list."}
      </div>
    </Card>
  );
}

function CompareColumn({ fit }: { fit: PathFit }) {
  return (
    <div className="rounded-lg border border-ink/10 p-3">
      <p className="font-black">{fit.path.title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Info label="Fit" value={`${fit.score}%`} />
        <Info label="APS" value={programmeApsRange(fit.path)} />
        <Info label="Matched" value={`${fit.matchedSubjects.length}/${fit.path.focusSubjects.length}`} />
        <Info label="Missing" value={String(fit.missingSubjects.length)} />
      </div>
    </div>
  );
}

function SimulatorCard({
  selectedPath,
  subjects,
  simulatedMarks,
  simulatedFit,
  originalFit,
  setSimulatedMarks
}: {
  selectedPath: CareerPath;
  subjects: LearnerSubjectLike[];
  simulatedMarks: Record<string, number>;
  simulatedFit: PathFit;
  originalFit: PathFit;
  setSimulatedMarks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const matchedSubjects = selectedPath.focusSubjects
    .map((subject) => findLearnerSubject(subjects, subject))
    .filter((subject): subject is LearnerSubjectLike => Boolean(subject))
    .slice(0, 4);
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-black"><SlidersHorizontal className="text-sky" size={20} /> Mark simulator</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">Test how improving key subject marks changes this route fit.</p>
      <div className="mt-4 space-y-3">
        {matchedSubjects.map((subject) => {
          const value = simulatedMarks[subject.name] ?? subject.currentMark;
          return (
            <label key={subject.name} className="block rounded-lg bg-chalk p-3 text-sm font-bold">
              <div className="flex items-center justify-between gap-3">
                <span>{subject.name}</span>
                <span>{value}%</span>
              </div>
              <input
                className="mt-3 w-full"
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(event) => setSimulatedMarks((current) => ({ ...current, [subject.name]: Number(event.target.value) }))}
              />
            </label>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg bg-veld/5 p-3 text-sm font-black text-ink">
        Fit changes from {originalFit.score}% to {simulatedFit.score}%.
      </div>
    </Card>
  );
}

function BursaryTieIn({ path }: { path: CareerPath }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-black"><WalletCards className="text-veld" size={20} /> Bursary tie-in</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        Search bursaries using fields linked to this route.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(path.bursaryFields ?? [path.title]).map((field) => (
          <Link key={field} href={`/bursaries?field=${encodeURIComponent(field)}`} className="focus-ring rounded-full border border-ink/10 bg-chalk px-3 py-1.5 text-xs font-black text-ink/75">
            {field}
          </Link>
        ))}
      </div>
      <Link href={buildBursaryHref(path)} className="mt-4 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">
        Open bursary matches
      </Link>
    </Card>
  );
}

function DiscussionSummary({ summary }: { summary: string }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-xl font-black"><MessageSquareText className="text-sky" size={20} /> Teacher or guardian note</h2>
      <p className="mt-3 rounded-lg bg-chalk p-3 text-sm leading-6 text-ink/75">{summary}</p>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-chalk p-2">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "safe" | "watch" | "risk" | "sample";
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink/55">{label}</p>
          <p className="mt-1 text-2xl font-black leading-tight">{value}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">{sub}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone === "safe" ? "bg-veld/10 text-veld" : tone === "watch" ? "bg-gold/15 text-amber-700" : tone === "risk" ? "bg-protea/10 text-protea" : "bg-sky/10 text-sky"}`}>
          {icon}
        </span>
      </div>
    </Card>
  );
}
