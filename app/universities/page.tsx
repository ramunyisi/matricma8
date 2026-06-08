"use client";

import { useMemo, useState } from "react";
import { ExternalLink, GraduationCap, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { nscLevel } from "@/lib/aps";
import { filterUniversities, universities } from "@/lib/universities";
import { sampleSubjects } from "@/lib/sample-data";

const provinces = ["All", ...Array.from(new Set(universities.map((university) => university.province))).sort()];
const types = ["All", ...Array.from(new Set(universities.map((university) => university.type))).sort()];
const defaultApsSubjects = [
  { name: "Mathematics", mark: 58 },
  { name: "Physical Sciences", mark: 62 },
  { name: "English Home Language", mark: 65 },
  { name: "Life Sciences", mark: 60 },
  { name: "Accounting", mark: 55 },
  { name: "Geography", mark: 57 }
];
const apsSubjectOptions = sampleSubjects.filter((subject) => subject !== "Life Orientation");

export default function UniversitiesPage() {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("All");
  const [type, setType] = useState("All");
  const [apsSubjects, setApsSubjects] = useState(defaultApsSubjects);
  const results = useMemo(() => filterUniversities(query, province, type), [query, province, type]);
  const aps = useMemo(() => generalAps(apsSubjects), [apsSubjects]);
  const prospectusUniversities = useMemo(
    () => universities.filter((university) => university.prospectusHighlights?.length),
    []
  );

  return (
    <AppShell>
      <PageHeader title="University Applications" eyebrow="Official application links">
        Find South African public universities and open their official application pages. Always confirm closing dates, fees, and programme requirements on the university website.
      </PageHeader>

      {prospectusUniversities.length ? (
        <div className="mb-4 grid gap-4 xl:grid-cols-2">
          {prospectusUniversities.map((university) => (
            <Card key={university.shortName} className="border-veld/20 bg-veld/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone="safe">Prospectus highlights</Badge>
                  <h2 className="mt-3 text-xl font-black">{university.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-ink/60">
                    {university.shortName} · {university.city}, {university.province}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {university.prospectusUrl ? (
                    <a href={university.prospectusUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">
                      Prospectus PDF <ExternalLink size={15} />
                    </a>
                  ) : null}
                  <a href={university.applicationUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-veld/30 bg-white px-4 py-2 text-sm font-black text-veld">
                    Apply <ExternalLink size={15} />
                  </a>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-ink/55">Admission</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                    {university.shortName === "NWU" ? (
                      <>
                        <li>APS is based on the six best subjects, excluding Life Orientation.</li>
                        <li>Bachelor’s entry requires at least 50% in any four 20-credit subjects.</li>
                        <li>Subject-specific faculty requirements still apply and may be more competitive.</li>
                        <li>Cambridge and international applicants can use NWU’s conversion tables.</li>
                      </>
                    ) : null}
                    {university.shortName === "UP" ? (
                      <>
                        <li>Applications open on 1 April of the year before study starts.</li>
                        <li>All undergraduate programmes are number-limited and final admission uses final NSC/IEB results.</li>
                        <li>Apply with final Grade 11 results and keep checking the student portal for feedback.</li>
                        <li>Veterinary Science closes on 31 May; all other faculties close on 30 June.</li>
                      </>
                    ) : null}
                    {university.shortName === "UCT" ? (
                      <>
                        <li>UCT APS is out of 600 and excludes Life Orientation, AP subjects, and non-official NSC subjects.</li>
                        <li>Degree entry needs at least 4 subjects at rating 4 (50-59%) or better in four 20-credit NSC subjects.</li>
                        <li>Different faculties and programmes have different entrance requirements.</li>
                        <li>Applicants in South Africa normally write the NBTs; Health Sciences applicants write them wherever they live.</li>
                      </>
                    ) : null}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-ink/55">Study support</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                    {university.shortName === "NWU" ? (
                      <>
                        <li>Academic Merit Bursary and external bursary options are highlighted in the prospectus.</li>
                        <li>Residence placement is a two-step process after application and conditional offer.</li>
                        <li>Interest-Index and campus visits help learners choose study fields.</li>
                      </>
                    ) : null}
                    {university.shortName === "UP" ? (
                      <>
                        <li>FLY@UP Assist awards are based on the six best subjects excluding Life Orientation.</li>
                        <li>Award A and subject awards can reward strong Mathematics and Physical Sciences results.</li>
                        <li>The prospectus links fees, funding, accommodation, sport, and other support resources.</li>
                      </>
                    ) : null}
                    {university.shortName === "UCT" ? (
                      <>
                        <li>UCT encourages applicants to make two choices to improve admission chances.</li>
                        <li>The Undergraduate Prospectus is the main source for programmes, campus info, and support services.</li>
                        <li>Admissions contact: {university.contactEmail}{university.contactPhone ? ` · ${university.contactPhone}` : ""}</li>
                      </>
                    ) : null}
                    {university.contactEmail || university.contactPhone ? (
                      <li>Contact: {university.contactEmail}{university.contactPhone ? ` · ${university.contactPhone}` : ""}</li>
                    ) : null}
                  </ul>
                </div>
              </div>
              {university.prospectusHighlights?.length ? (
                <div className="mt-5">
                  <h3 className="text-sm font-black uppercase tracking-wide text-ink/55">Useful prospectus notes</h3>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/75 md:grid-cols-2">
                    {university.prospectusHighlights.map((item) => <li key={item} className="rounded-lg bg-white p-3 shadow-sm">{item}</li>)}
                  </ul>
                </div>
              ) : null}
              {university.prospectusNotes?.length ? (
                <p className="mt-4 text-sm leading-6 text-ink/65">{university.prospectusNotes.join(" ")}</p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="mb-4">
        <label className="block text-sm font-bold">
          Search university, abbreviation, province, or city
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
            <input
              className="input mt-0 pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: UJ, Cape Town, technology, KwaZulu-Natal"
            />
          </div>
        </label>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-bold">
            Province
            <select className="input" value={province} onChange={(event) => setProvince(event.target.value)}>
              {provinces.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Institution type
            <select className="input" value={type} onChange={(event) => setType(event.target.value)}>
              {types.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => { setQuery(""); setProvince("All"); setType("All"); }} className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-3 text-sm font-black text-ink">
              Clear filters
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink/65"><span className="font-black text-ink">{results.length}</span> universities found.</p>
      </Card>

      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Quick APS estimate</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/65">
              This uses the common NSC level scale and excludes Life Orientation. Universities can calculate APS differently, so use this only as a planning estimate.
            </p>
          </div>
          <div className="rounded-lg bg-veld/10 px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-wide text-veld">Estimated APS</p>
            <p className="text-3xl font-black text-ink">{aps}</p>
            <p className="text-xs font-semibold text-ink/55">out of 42 style</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {apsSubjects.map((subject, index) => (
            <div key={`${subject.name}-${index}`} className="text-sm font-bold">
              Subject
              <select
                className="input mt-2"
                value={subject.name}
                onChange={(event) => updateApsSubject(index, event.target.value, setApsSubjects)}
              >
                {apsSubjectOptions.map((option) => (
                  <option key={option} value={option} disabled={apsSubjects.some((item, itemIndex) => itemIndex !== index && item.name === option)}>
                    {option}
                  </option>
                ))}
              </select>
              <label className="mt-3 block">
                Mark
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2">
                <input
                  className="w-full bg-transparent outline-none"
                  type="number"
                  min="0"
                  max="100"
                  value={subject.mark}
                  onChange={(event) => updateApsMark(index, Number(event.target.value), setApsSubjects)}
                />
                <span className="text-xs font-black text-ink/50">L{nscLevel(subject.mark)}</span>
              </div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((university) => (
          <Card key={university.shortName} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-veld/10 text-veld">
                <GraduationCap size={22} />
              </span>
              <Badge tone={university.applicationSystem ? "watch" : "sample"}>{university.applicationSystem ?? "Direct"}</Badge>
            </div>
            <h2 className="mt-4 text-xl font-black">{university.name}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/60">{university.shortName} | {university.city}, {university.province}</p>
            <p className="mt-3 text-sm font-bold text-ink/70">{university.type}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-ink/55">
              {university.apsCalculatorUrl ? "Official APS calculator available." : "Admission requirements link available. APS may be programme-specific."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={university.applicationUrl} target="_blank" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">
                Apply <ExternalLink size={15} />
              </a>
              <a href={university.apsCalculatorUrl ?? university.apsInfoUrl} target="_blank" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-veld/30 bg-veld/10 px-4 py-2 text-sm font-black text-veld">
                {university.apsCalculatorUrl ? "APS calculator" : "Requirements"} <ExternalLink size={15} />
              </a>
              <a href={university.websiteUrl} target="_blank" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2 text-sm font-black text-ink">
                Website <ExternalLink size={15} />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function generalAps(subjects: typeof defaultApsSubjects) {
  return subjects
    .slice(0, 6)
    .reduce((total, subject) => total + nscLevel(subject.mark), 0);
}

function updateApsSubject(index: number, name: string, setSubjects: React.Dispatch<React.SetStateAction<typeof defaultApsSubjects>>) {
  setSubjects((current) => current.map((subject, itemIndex) => (
    itemIndex === index ? { ...subject, name } : subject
  )));
}

function updateApsMark(index: number, mark: number, setSubjects: React.Dispatch<React.SetStateAction<typeof defaultApsSubjects>>) {
  setSubjects((current) => current.map((subject, itemIndex) => (
    itemIndex === index ? { ...subject, mark: Math.max(0, Math.min(100, mark || 0)) } : subject
  )));
}
