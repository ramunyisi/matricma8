"use client";

import { useMemo, useState } from "react";
import { ExternalLink, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { matchBursaries, isClosingSoon } from "@/lib/bursaries";
import { demoProfile, provinces, sampleBursaries } from "@/lib/sample-data";
import { formatDate } from "@/lib/utils";

export default function BursariesPage() {
  const [field, setField] = useState("All");
  const [province, setProvince] = useState("All");
  const [openNow, setOpenNow] = useState(true);
  const [closingSoon, setClosingSoon] = useState(false);
  const matches = useMemo(() => {
    return matchBursaries(demoProfile, sampleBursaries, new Date("2026-06-05")).filter((match) => {
      if (field !== "All" && match.bursary.fieldOfStudy !== field) return false;
      if (province !== "All" && !match.bursary.provinceRequirements.includes("All provinces") && !match.bursary.provinceRequirements.includes(province)) return false;
      if (openNow && new Date(match.bursary.deadline) < new Date("2026-06-05")) return false;
      if (closingSoon && !isClosingSoon(match.bursary.deadline, new Date("2026-06-05"))) return false;
      return true;
    });
  }, [field, province, openNow, closingSoon]);

  return (
    <AppShell>
      <PageHeader title="Bursary Matcher" eyebrow="Sample data">
        Bursary data here is marked sample data. Production records must be sourced, verified, and refreshed from official provider pages.
      </PageHeader>
      <Card className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-black"><SlidersHorizontal size={18} /> Filters</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <Filter label="Field"><select value={field} onChange={(event) => setField(event.target.value)} className="input"><option>All</option><option>Engineering</option><option>Commerce</option><option>Information Technology</option></select></Filter>
          <Filter label="Province"><select value={province} onChange={(event) => setProvince(event.target.value)} className="input"><option>All</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></Filter>
          <label className="flex items-center gap-2 rounded-lg bg-chalk p-3 text-sm font-bold"><input type="checkbox" checked={openNow} onChange={(event) => setOpenNow(event.target.checked)} /> Open now</label>
          <label className="flex items-center gap-2 rounded-lg bg-chalk p-3 text-sm font-bold"><input type="checkbox" checked={closingSoon} onChange={(event) => setClosingSoon(event.target.checked)} /> Closing soon</label>
          <label className="flex items-center gap-2 rounded-lg bg-chalk p-3 text-sm font-bold"><input type="checkbox" /> Grade 12 only</label>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((match) => (
          <Card key={match.bursary.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="sample">Sample data</Badge>
                <h2 className="mt-3 text-xl font-black">{match.bursary.name}</h2>
                <p className="text-sm font-semibold text-ink/60">{match.bursary.provider}</p>
              </div>
              <Badge tone={match.matchScore >= 75 ? "safe" : match.matchScore >= 50 ? "watch" : "risk"}>{match.matchScore}%</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Field" value={match.bursary.fieldOfStudy} />
              <Info label="Deadline" value={formatDate(match.bursary.deadline)} />
              <Info label="Minimum average" value={`${match.bursary.minAverage}%`} />
              <Info label="Province" value={match.bursary.provinceRequirements.join(", ")} />
            </dl>
            <p className="mt-4 text-sm font-bold">Required documents</p>
            <p className="mt-1 text-sm text-ink/65">{match.bursary.requiredDocumentsJson.join(", ")}</p>
            <p className="mt-4 text-sm font-bold">Reason for match</p>
            <ul className="mt-1 space-y-1 text-sm leading-6 text-ink/65">
              {match.matchReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <a href={match.bursary.applicationUrl} target="_blank" className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 font-black text-white">
              Application link <ExternalLink size={16} />
            </a>
          </Card>
        ))}
      </div>
      <style jsx>{`.input{width:100%;border-radius:.5rem;border:1px solid rgb(23 33 43 / .15);padding:.75rem;background:white}`}</style>
    </AppShell>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold">{label}<span className="mt-2 block">{children}</span></label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-bold text-ink/55">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}
