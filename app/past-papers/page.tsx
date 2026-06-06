"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileQuestion, PenLine, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { loadPastPaperQuestions } from "@/lib/content-data";
import { filterPastPaperQuestions } from "@/lib/past-papers";
import { sampleQuestions, sampleSubjects } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { PastPaperQuestion } from "@/lib/types";
import { friendlyError } from "@/lib/utils";

export default function PastPapersPage() {
  const [allQuestions, setAllQuestions] = useState<PastPaperQuestion[]>(sampleQuestions);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState(12);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [subject, setSubject] = useState("All");
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [mode, setMode] = useState<"practice" | "marking">("practice");
  const [practiceQuestions, setPracticeQuestions] = useState<Record<string, string>>({});
  const [loadingExplanationId, setLoadingExplanationId] = useState<string | null>(null);
  const topics = Array.from(new Set(allQuestions.map((question) => question.topic)));
  const subjects = Array.from(new Set([...sampleSubjects, ...allQuestions.map((question) => question.subject)]));
  const years = Array.from(new Set(allQuestions.map((question) => question.year))).sort((a, b) => b - a);
  const questions = useMemo(() => filterPastPaperQuestions(allQuestions, { grade, subject, topic, difficulty, year, query }), [allQuestions, grade, subject, topic, difficulty, year, query]);

  useEffect(() => {
    loadPastPaperQuestions(getSupabaseBrowserClient()).then(setAllQuestions);
  }, []);

  async function generatePractice(question: PastPaperQuestion) {
    setLoadingExplanationId(question.id);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "relatedPracticeQuestion",
          questionMetadata: question
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate practice question.");
      setPracticeQuestions((current) => ({ ...current, [question.id]: data.result }));
    } catch (error) {
      setPracticeQuestions((current) => ({ ...current, [question.id]: friendlyError(error, "Could not generate a practice question.") }));
    } finally {
      setLoadingExplanationId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Past-Paper Navigator" eyebrow="DBE-linked metadata">
        Search past papers by topic, source, year, paper, or question number. Practice cards generate original AI questions related to the matched paper record, with a link to download the exact paper.
      </PageHeader>
      <Card className="mb-4">
        <label className="block text-sm font-bold">Search paper sources, question number, or chapter title
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Example: functions and graphs, question 1.2, Paper 1, DBE"
          />
        </label>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <label className="text-sm font-bold">Grade<select className="input" value={grade} onChange={(event) => setGrade(Number(event.target.value))}><option value={10}>10</option><option value={11}>11</option><option value={12}>12</option></select></label>
          <label className="text-sm font-bold">Subject<select className="input" value={subject} onChange={(event) => setSubject(event.target.value)}><option>All</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-bold">Topic<select className="input" value={topic} onChange={(event) => setTopic(event.target.value)}><option>All</option>{topics.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-bold">Difficulty<select className="input" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All</option><option>easy</option><option>medium</option><option>hard</option></select></label>
          <label className="text-sm font-bold">Paper year<select className="input" value={year ?? ""} onChange={(event) => setYear(event.target.value ? Number(event.target.value) : undefined)}><option value="">All</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/65">
          <p><span className="font-black text-ink">{questions.length}</span> matching question records, ordered by newest year first.</p>
          <button onClick={() => { setQuery(""); setSubject("All"); setTopic("All"); setDifficulty("All"); setYear(undefined); }} className="focus-ring rounded-lg border border-ink/15 px-3 py-2 font-black text-ink">
            Clear search
          </button>
        </div>
      </Card>
      <div className="mb-4 inline-flex rounded-lg border border-ink/10 bg-white p-1">
        <button onClick={() => setMode("practice")} className={`rounded-md px-4 py-2 text-sm font-black ${mode === "practice" ? "bg-veld text-white" : "text-ink/65"}`}>Practice mode</button>
        <button onClick={() => setMode("marking")} className={`rounded-md px-4 py-2 text-sm font-black ${mode === "marking" ? "bg-veld text-white" : "text-ink/65"}`}>Marking mode</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {questions.map((question) => (
          <Card key={question.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={question.difficulty === "hard" ? "risk" : question.difficulty === "medium" ? "watch" : "safe"}>{question.difficulty}</Badge>
                <h2 className="mt-3 text-xl font-black">{question.subject}</h2>
                <p className="text-sm text-ink/65">{question.topic}</p>
              </div>
              {mode === "practice" ? <FileQuestion className="text-veld" /> : <PenLine className="text-sky" />}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Year" value={String(question.year)} />
              <Info label="Question" value={question.questionNumber ?? "Metadata"} />
              <Info label="Paper" value={question.paperNumber} />
              <Info label="Session" value={question.examSession} />
              <Info label="Marks" value={String(question.marks)} />
              <Info label="Pages" value={`Q ${question.pageNumber}, memo ${question.memoPageNumber}`} />
            </dl>
            <div className="mt-4 rounded-lg bg-chalk p-3 text-sm leading-6 text-ink/70">
              {mode === "practice"
                ? "Generate an original practice question related to this paper, topic, and question record. The generated question is not copied from the official paper."
                : "Download the paper and memo, then use the generated practice solution to compare method and concepts."}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-black text-white" href={paperHref(question.paperUrl)} target="_blank">Download paper <ExternalLink size={14} /></a>
              <a className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-2 text-sm font-black" href={question.memoUrl} target="_blank">Memo link <ExternalLink size={14} /></a>
              <button onClick={() => generatePractice(question)} disabled={loadingExplanationId === question.id} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-veld/30 bg-veld/10 px-3 py-2 text-sm font-black text-veld disabled:opacity-60">
                <Sparkles size={14} />
                {loadingExplanationId === question.id ? "Generating..." : "Generate practice + solution"}
              </button>
            </div>
            {practiceQuestions[question.id] ? (
              <div className="mt-4 whitespace-pre-wrap rounded-lg border border-veld/20 bg-white p-3 text-sm leading-6 text-ink/75">
                {practiceQuestions[question.id]}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      <style jsx>{`.input{margin-top:.5rem;width:100%;border-radius:.5rem;border:1px solid rgb(23 33 43 / .15);padding:.75rem;background:white}`}</style>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-bold text-ink/55">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}

function paperHref(url: string) {
  const prefix = "local://past_papers/";
  if (url.startsWith(prefix)) {
    return `/api/papers/download?file=${encodeURIComponent(decodeURIComponent(url.slice(prefix.length)))}`;
  }
  return url;
}
