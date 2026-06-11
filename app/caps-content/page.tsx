"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { capsContentLibrary, capsContentSections } from "@/lib/caps-content";

const categories = ["All", "CAPS policy", "Mind the Gap", "Workbooks", "Digital content"] as const;

export default function CapsContentPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return capsContentLibrary.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const haystack = [item.subject, item.title, item.summary, item.category, ...item.tags].join(" ").toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const sectionResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return capsContentSections.filter((item) => {
      const haystack = [item.subject, item.topic, item.sectionTitle, item.sectionSummary, item.sectionText, item.sourceTitle, ...item.keywords].join(" ").toLowerCase();
      return !normalized || haystack.includes(normalized);
    });
  }, [query]);

  return (
    <AppShell>
      <PageHeader title="CAPS Content" eyebrow="DBE-backed source library">
        Browse official CAPS, Mind the Gap, workbook, and digital support resources that the coach can use as grounding.
      </PageHeader>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="text-sm font-bold">
            Search
            <div className="focus-ring mt-2 flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2">
              <Search size={16} className="text-ink/40" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search subject, title, or keyword..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <label className="text-sm font-bold">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}
              className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-2"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {results.map((item) => (
          <Card key={`${item.title}-${item.subject}`} className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-veld">{item.category}</p>
                <h2 className="mt-1 text-lg font-black">{item.title}</h2>
              </div>
              <Badge tone="sample">{item.grade === "all" ? "All grades" : `Grade ${item.grade}`}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/70">{item.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="watch">{item.subject}</Badge>
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} tone="neutral">{tag}</Badge>
              ))}
            </div>
            <a
              href={item.sourceUrl}
              target="_blank"
              className="focus-ring mt-4 inline-flex items-center gap-2 self-start rounded-lg border border-ink/15 px-3 py-2 text-sm font-black"
            >
              Open source <ExternalLink size={14} />
            </a>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">CAPS sections</h2>
            <p className="text-sm text-ink/65">Chunked source notes that the coach can cite directly.</p>
          </div>
          <Badge tone="sample">{sectionResults.length} sections</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {sectionResults.slice(0, 6).map((section) => (
            <details key={`${section.sectionTitle}-${section.topic}`} className="rounded-lg border border-ink/10 bg-chalk p-3">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-veld">{section.sourceType}</p>
                    <h3 className="mt-1 text-base font-black">{section.sectionTitle}</h3>
                  </div>
                  <Badge tone="watch">{section.grade === "all" ? "All grades" : `Grade ${section.grade}`}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink/65">{section.subject} • {section.topic}</p>
              </summary>
              <p className="mt-3 text-sm leading-6 text-ink/75">{section.sectionSummary}</p>
              <p className="mt-2 text-sm leading-6 text-ink/80">{section.sectionText}</p>
              <p className="mt-3 text-xs text-ink/55">
                {section.sourceTitle}{section.pageStart ? ` • Pages ${section.pageStart}${section.pageEnd ? `-${section.pageEnd}` : ""}` : ""}
              </p>
              <a
                href={section.sourceUrl}
                target="_blank"
                className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-black"
              >
                Open source <ExternalLink size={14} />
              </a>
            </details>
          ))}
        </div>
      </Card>

      {results.length === 0 ? (
        <Card className="mt-4">
          <p className="text-sm text-ink/65">No CAPS content matched your search.</p>
        </Card>
      ) : null}
    </AppShell>
  );
}
