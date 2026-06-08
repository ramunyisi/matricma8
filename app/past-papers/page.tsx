"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { loadPastPapers } from "@/lib/content-data";
import { filterPastPapers } from "@/lib/past-papers";
import { sampleSubjects } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { PastPaper } from "@/lib/types";

export default function PastPapersPage() {
  const [allPapers, setAllPapers] = useState<PastPaper[]>([]);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState(12);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [subject, setSubject] = useState("All");

  useEffect(() => {
    loadPastPapers(getSupabaseBrowserClient()).then(setAllPapers);
  }, []);

  const subjects = Array.from(new Set([...sampleSubjects, ...allPapers.map((paper) => paper.subject)])).sort();
  const years = Array.from(new Set(allPapers.map((paper) => paper.year))).sort((a, b) => b - a);
  const papers = useMemo(() => filterPastPapers(allPapers, { grade, subject, year, query }), [allPapers, grade, subject, year, query]);
  const groupedPapers = useMemo(() => groupPapers(papers), [papers]);

  return (
    <AppShell>
      <PageHeader title="Past Papers" eyebrow="Paper and memo library">
        Search by paper, subject, year, exam session, language, or DBE filename. Papers are grouped by subject and year, with the solution memo shown next to each paper when DBE provides one.
      </PageHeader>

      <Card className="mb-4">
        <label className="block text-sm font-bold">
          Search filename or paper details
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
            <input
              className="input mt-0 pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: Mathematics Paper 1 English 2025 memo"
            />
          </div>
        </label>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-bold">
            Grade
            <select className="input" value={grade} onChange={(event) => setGrade(Number(event.target.value))}>
              <option value={10}>10</option>
              <option value={11}>11</option>
              <option value={12}>12</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Subject
            <select className="input" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>All</option>
              {subjects.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Year
            <select className="input" value={year ?? ""} onChange={(event) => setYear(event.target.value ? Number(event.target.value) : undefined)}>
              <option value="">All</option>
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/65">
          <p><span className="font-black text-ink">{papers.length}</span> matching papers.</p>
          <button onClick={() => { setQuery(""); setSubject("All"); setYear(undefined); }} className="focus-ring rounded-lg border border-ink/15 px-3 py-2 font-black text-ink">
            Clear search
          </button>
        </div>
      </Card>

      {papers.length === 0 ? (
        <Card>
          <h2 className="text-xl font-black">No papers found</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">Try another filename, subject, or year.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedPapers.map((group) => (
            <Card key={`${group.subject}-${group.year}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{group.subject}</h2>
                  <p className="mt-1 text-sm font-semibold text-ink/60">Grade {grade} | {group.year}</p>
                </div>
                <Badge tone="sample">{group.papers.length} {group.papers.length === 1 ? "paper" : "papers"}</Badge>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-ink/10">
                <div className="hidden grid-cols-[1fr_1fr_auto] gap-3 bg-chalk px-3 py-2 text-xs font-black uppercase tracking-wide text-ink/55 md:grid">
                  <span>Past paper</span>
                  <span>Solution memo</span>
                  <span>Details</span>
                </div>
                <div className="divide-y divide-ink/10">
                  {group.papers.map((paper) => (
                    <div key={paper.id} className="grid gap-3 p-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
                      <FileDownload title={paperTitle(paper)} href={downloadHref(paper.paperUrl)} label="Download paper" primary />
                      {paper.memoUrl ? (
                        <FileDownload title={memoTitle(paper)} href={downloadHref(paper.memoUrl)} label="Download memo" />
                      ) : (
                        <div className="rounded-lg border border-dashed border-ink/15 p-3 text-sm font-semibold text-ink/55">No solution memo uploaded yet.</div>
                      )}
                      <div className="text-sm font-semibold text-ink/65 md:min-w-36">
                        <p className="text-ink">{paper.examSession}</p>
                        <p>{paper.paperNumber}</p>
                        {paper.language ? <p>{paper.language}</p> : null}
                        {paper.collectionTitle ? <p className="mt-1 max-w-40 text-xs leading-5 text-ink/55">{paper.collectionTitle}</p> : null}
                        {paper.sampleData ? <p className="mt-1 text-xs text-sky">Sample data</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

    </AppShell>
  );
}

function paperTitle(paper: PastPaper) {
  return [paper.paperNumber, paper.language].filter(Boolean).join(" | ") || paper.paperFilename;
}

function memoTitle(paper: PastPaper) {
  return [`${paper.paperNumber} memo`, paper.language].filter(Boolean).join(" | ") || paper.memoFilename || "Solution memo";
}

function FileDownload({ title, href, label, primary = false }: { title: string; href: string; label: string; primary?: boolean }) {
  return (
    <div className="rounded-lg border border-ink/10 p-3">
      <div className="flex items-start gap-2">
        <FileText className={primary ? "mt-0.5 text-veld" : "mt-0.5 text-sky"} size={18} />
        <p className="min-w-0 break-words text-sm font-bold leading-5 text-ink">{title}</p>
      </div>
      <a className={`focus-ring mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${primary ? "bg-ink text-white" : "border border-ink/15 text-ink"}`} href={href} target="_blank">
        <Download size={14} />
        {label}
      </a>
    </div>
  );
}

function groupPapers(papers: PastPaper[]) {
  const groups = new Map<string, { subject: string; year: number; papers: PastPaper[] }>();

  for (const paper of papers) {
    const key = `${paper.subject}|${paper.year}`;
    const current = groups.get(key) ?? { subject: paper.subject, year: paper.year, papers: [] };
    current.papers.push(paper);
    groups.set(key, current);
  }

  return Array.from(groups.values()).sort((a, b) => a.subject.localeCompare(b.subject) || b.year - a.year);
}

function downloadHref(url: string) {
  if (url.startsWith("local://past_papers/")) {
    return `/api/papers/download?file=${encodeURIComponent(decodeURIComponent(url.slice("local://past_papers/".length)))}`;
  }

  if (url.startsWith("storage://past-papers/")) {
    return `/api/papers/download?storagePath=${encodeURIComponent(url.slice("storage://past-papers/".length))}`;
  }

  return url;
}
