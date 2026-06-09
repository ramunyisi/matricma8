"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Search as SearchIcon, SlidersHorizontal, Bookmark, BellRing, BookmarkCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { bursaryLiveStatus, matchBursaries } from "@/lib/bursaries";
import { loadBursaries } from "@/lib/content-data";
import { verifiedBursaries } from "@/lib/bursary-directory";
import { provinces } from "@/lib/sample-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import type { Bursary } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const studyLevelOptions = [
  "All",
  "undergraduate",
  "postgraduate",
  "TVET",
  "second-year undergraduate",
  "initial teacher education"
];

const fundingTypeOptions = [
  "All",
  "bursary",
  "scholarship",
  "financial aid",
  "bursary / scholarship"
];

const fieldOptions = [
  "All",
  "All fields / financial aid",
  "Accounting",
  "Accounting / Finance / STEM",
  "Commerce",
  "Commerce / Finance / Technology",
  "Education / Teaching",
  "Engineering",
  "Engineering / Logistics / Built environment",
  "Engineering / Science / Technology",
  "Finance / Banking / Scarce skills",
  "Information Technology",
  "Multiple fields"
];

const storageKeys = {
  shortlist: "matricsa-bursary-shortlist",
  reminders: "matricsa-bursary-reminders"
};

export default function BursariesPage() {
  const { profile, isDemo } = useLearnerProfile();
  const [bursaries, setBursaries] = useState<Bursary[]>(verifiedBursaries);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("All");
  const [province, setProvince] = useState("All");
  const [studyLevel, setStudyLevel] = useState("All");
  const [fundingType, setFundingType] = useState("All");
  const [status, setStatus] = useState<"all" | "open" | "closing" | "closed" | "unknown">("all");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [reminders, setReminders] = useState<Record<string, number>>({});
  const [reminderDrafts, setReminderDrafts] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [isServerReminderSyncEnabled, setIsServerReminderSyncEnabled] = useState(false);
  const [hasLoadedInitialReminderState, setHasLoadedInitialReminderState] = useState(false);
  const lastSyncedSnapshot = useRef("");

  useEffect(() => {
    loadBursaries(getSupabaseBrowserClient()).then(setBursaries);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsHydrated(true);
    if (typeof window === "undefined") return;
    try {
      const savedShortlist = window.localStorage.getItem(storageKeys.shortlist);
      const savedReminders = window.localStorage.getItem(storageKeys.reminders);
      if (savedShortlist) setShortlist(JSON.parse(savedShortlist));
      if (savedReminders) setReminders(JSON.parse(savedReminders));
    } catch {
      // Ignore invalid local storage values.
    }

    loadServerReminderState()
      .then((result) => {
        if (!isMounted || !result) return;
        setIsServerReminderSyncEnabled(true);
        if (result.shortlist.length > 0 || Object.keys(result.reminders).length > 0) {
          setShortlist(result.shortlist);
          setReminders(result.reminders);
        }
      })
      .finally(() => {
        if (isMounted) setHasLoadedInitialReminderState(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(storageKeys.shortlist, JSON.stringify(shortlist));
  }, [isHydrated, shortlist]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(storageKeys.reminders, JSON.stringify(reminders));
  }, [isHydrated, reminders]);

  useEffect(() => {
    if (!hasLoadedInitialReminderState || !isServerReminderSyncEnabled) return;
    const snapshot = JSON.stringify({ shortlist, reminders });
    if (snapshot === lastSyncedSnapshot.current) return;

    const timer = window.setTimeout(() => {
      syncReminderState(shortlist, reminders)
        .then((synced) => {
          if (synced) {
            lastSyncedSnapshot.current = snapshot;
          }
        })
        .catch(() => {
          // Keep the local state usable even if server sync fails.
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [hasLoadedInitialReminderState, isServerReminderSyncEnabled, reminders, shortlist]);

  const filtered = useMemo(() => {
    const today = new Date();
    const loweredQuery = query.trim().toLowerCase();

    return bursaries
      .filter((bursary) => {
        if (field !== "All" && !matchesFieldOfStudy(bursary.fieldOfStudy, field)) return false;
        if (province !== "All" && !bursary.provinceRequirements.includes("All provinces") && !bursary.provinceRequirements.includes(province)) return false;
        if (studyLevel !== "All" && !matchesStudyLevel(bursary.studyLevels ?? [], studyLevel)) return false;
        if (fundingType !== "All" && !matchesFundingType(bursary.fundingType ?? "", fundingType)) return false;

        const currentStatus = bursaryLiveStatus(bursary, today);
        if (status !== "all" && currentStatus !== status) return false;

        if (!loweredQuery) return true;

        return [
          bursary.name,
          bursary.provider,
          bursary.fieldOfStudy,
          bursary.fundingType ?? "",
          bursary.summary ?? "",
          bursary.applicationWindow ?? "",
          bursary.citizenshipRequirements,
          bursary.requiredDocumentsJson.join(" "),
          bursary.eligibilityCriteriaJson?.join(" ") ?? "",
          bursary.applicationUrl,
          bursary.sourceUrl
        ].join(" ").toLowerCase().includes(loweredQuery);
      })
      .sort((a, b) => {
        const aStatus = bursaryLiveStatus(a, today);
        const bStatus = bursaryLiveStatus(b, today);
        const statusRank = (value: string) => (value === "open" ? 0 : value === "closing" ? 1 : value === "unknown" ? 2 : 3);
        const diff = statusRank(aStatus) - statusRank(bStatus);
        if (diff !== 0) return diff;
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return aDeadline - bDeadline;
      });
  }, [bursaries, field, fundingType, province, query, status, studyLevel]);

  const matches = useMemo(() => matchBursaries(profile, filtered, new Date()), [filtered, profile]);
  const shortlistEntries = useMemo(() => bursaries.filter((bursary) => shortlist.includes(bursary.id)), [bursaries, shortlist]);
  const reminderAlerts = useMemo(() => {
    const today = new Date();
    return shortlistEntries
      .map((bursary) => {
        const daysBeforeDeadline = reminders[bursary.id];
        if (!daysBeforeDeadline || !bursary.deadline) return null;
        const deadline = new Date(`${bursary.deadline}T23:59:59`);
        if (Number.isNaN(deadline.getTime())) return null;
        const reminderDate = new Date(deadline);
        reminderDate.setDate(reminderDate.getDate() - daysBeforeDeadline);
        const dueSoon = today >= reminderDate && today <= deadline;
        return dueSoon ? { bursary, daysBeforeDeadline, deadline } : null;
      })
      .filter((item): item is { bursary: Bursary; daysBeforeDeadline: number; deadline: Date } => Boolean(item))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [reminders, shortlistEntries]);

  function toggleShortlist(id: string) {
    setShortlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function setReminder(id: string) {
    const next = reminderDrafts[id] ?? 14;
    setReminders((current) => ({ ...current, [id]: next }));
    setShortlist((current) => (current.includes(id) ? current : [...current, id]));
  }

  function clearReminder(id: string) {
    setReminders((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  return (
    <AppShell>
      <PageHeader title="Bursaries Directory" eyebrow={isDemo ? "Sample learner profile" : "Your saved profile"}>
        Search official bursary opportunities, compare the requirements, and open the application link from the bursary card.
      </PageHeader>

      {reminderAlerts.length > 0 ? (
        <Card className="mb-4 border-gold/30 bg-gold/10">
          <div className="flex items-start gap-3">
            <BellRing className="mt-1 text-gold" size={18} />
            <div>
              <p className="font-black">Reminder alerts</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/75">
                {reminderAlerts.slice(0, 3).map((item) => (
                  <li key={item.bursary.id}>
                    {item.bursary.name} closes on {formatDeadline(item.bursary.deadline)}. You asked to be reminded {item.daysBeforeDeadline} days before the deadline.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="mb-4">
        <div className="flex items-center gap-2 text-lg font-black">
          <SlidersHorizontal size={18} /> Filters
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-6">
          <label className="text-sm font-bold lg:col-span-2">
            Search bursaries
            <span className="relative mt-2 block">
              <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                className="input mt-0 pl-10"
                placeholder="Search by bursary, provider, field, or keyword"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </span>
          </label>
          <Filter label="Field">
            <select className="input" value={field} onChange={(event) => setField(event.target.value)}>
              {fieldOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Filter>
          <Filter label="Province">
            <select className="input" value={province} onChange={(event) => setProvince(event.target.value)}>
              <option>All</option>
              {provinces.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Filter>
          <Filter label="Study level">
            <select className="input" value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)}>
              {studyLevelOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Filter>
          <Filter label="Funding type">
            <select className="input" value={fundingType} onChange={(event) => setFundingType(event.target.value)}>
              {fundingTypeOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Filter>
          <Filter label="Status">
            <select className="input" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">All</option>
              <option value="open">Open now</option>
              <option value="closing">Closing soon</option>
              <option value="closed">Closed</option>
              <option value="unknown">Check official page</option>
            </select>
          </Filter>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => {
              const currentStatus = bursaryLiveStatus(match.bursary, new Date());
              const isSaved = shortlist.includes(match.bursary.id);
              const reminderDays = reminderDrafts[match.bursary.id] ?? reminders[match.bursary.id] ?? 14;
              const hasDeadline = Boolean(match.bursary.deadline);

              return (
                <Card key={match.bursary.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge tone={badgeTone(currentStatus)}>{statusLabel(currentStatus)}</Badge>
                      <h2 className="mt-3 text-xl font-black">{match.bursary.name}</h2>
                      <p className="text-sm font-semibold text-ink/60">{match.bursary.provider}</p>
                    </div>
                    <Badge tone={match.matchScore >= 75 ? "safe" : match.matchScore >= 50 ? "watch" : "risk"}>{match.matchScore}%</Badge>
                  </div>

                  {match.bursary.summary ? <p className="mt-3 text-sm leading-6 text-ink/75">{match.bursary.summary}</p> : null}

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Info label="Field" value={match.bursary.fieldOfStudy} />
                    <Info label="Funding type" value={match.bursary.fundingType ?? "Check official page"} />
                    <Info label="Deadline" value={formatDeadline(match.bursary.deadline)} />
                    <Info label="Status" value={currentStatus} />
                    <Info label="Province" value={match.bursary.provinceRequirements.join(", ")} />
                    <Info label="Minimum avg" value={match.bursary.minAverage > 0 ? `${match.bursary.minAverage}%` : "Check official page"} />
                    <Info label="Study level" value={(match.bursary.studyLevels ?? []).join(", ") || "Check official page"} />
                    <Info label="Last checked" value={match.bursary.lastCheckedAt ? formatDate(match.bursary.lastCheckedAt) : "Not listed"} />
                  </dl>

                  {match.bursary.applicationWindow ? <p className="mt-4 text-sm text-ink/65">{match.bursary.applicationWindow}</p> : null}
                  {match.bursary.eligibilityCriteriaJson?.length ? (
                    <>
                      <p className="mt-4 text-sm font-bold">Eligibility criteria</p>
                      <ul className="mt-1 space-y-1 text-sm leading-6 text-ink/65">
                        {match.bursary.eligibilityCriteriaJson.map((criterion) => <li key={criterion}>{criterion}</li>)}
                      </ul>
                    </>
                  ) : null}
                  <p className="mt-4 text-sm font-bold">Required documents</p>
                  <p className="mt-1 text-sm text-ink/65">{match.bursary.requiredDocumentsJson.join(", ")}</p>

                  {match.bursary.notes ? (
                    <>
                      <p className="mt-4 text-sm font-bold">Notes</p>
                      <p className="mt-1 text-sm leading-6 text-ink/65">{match.bursary.notes}</p>
                    </>
                  ) : null}

                  <p className="mt-4 text-sm font-bold">Why this appears for you</p>
                  <ul className="mt-1 space-y-1 text-sm leading-6 text-ink/65">
                    {match.matchReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
                    {match.matchReasons.length === 0 ? <li>Open the official link and verify the criteria.</li> : null}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a href={match.bursary.applicationUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 font-black text-white">
                      Application link <ExternalLink size={16} />
                    </a>
                    <a href={match.bursary.sourceUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2 font-black text-ink">
                      Source page
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleShortlist(match.bursary.id)}
                      className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2 font-black text-ink"
                    >
                      {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      {isSaved ? "Saved" : "Save for later"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="text-sm font-bold">
                      Reminder
                      <select
                        className="input mt-2 w-44"
                        disabled={!hasDeadline}
                        value={reminderDays}
                        onChange={(event) => setReminderDrafts((current) => ({ ...current, [match.bursary.id]: Number(event.target.value) }))}
                      >
                        <option value={7}>7 days before</option>
                        <option value={14}>14 days before</option>
                        <option value={30}>30 days before</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={!hasDeadline}
                      onClick={() => setReminder(match.bursary.id)}
                      className="focus-ring rounded-lg bg-veld px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      Set reminder
                    </button>
                    {reminders[match.bursary.id] ? (
                      <button
                        type="button"
                        onClick={() => clearReminder(match.bursary.id)}
                        className="focus-ring rounded-lg border border-ink/10 px-4 py-3 text-sm font-black text-ink"
                      >
                        Clear reminder
                      </button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-black">Directory summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Bursaries shown" value={matches.length.toString()} />
              <Metric label="Verified entries" value={bursaries.length.toString()} />
              <Metric label="Open now" value={bursaries.filter((bursary) => bursaryLiveStatus(bursary, new Date()) === "open").length.toString()} />
              <Metric label="Need review" value={bursaries.filter((bursary) => bursaryLiveStatus(bursary, new Date()) === "unknown").length.toString()} />
              <Metric label="Saved" value={shortlist.length.toString()} />
              <Metric label="Reminders" value={Object.keys(reminders).length.toString()} />
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Saved shortlist</h2>
            {shortlistEntries.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/75">
                {shortlistEntries.map((bursary) => (
                  <li key={bursary.id} className="rounded-lg bg-chalk p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{bursary.name}</p>
                        <p className="text-xs font-semibold text-ink/55">{bursary.provider}</p>
                      </div>
                      <button type="button" onClick={() => toggleShortlist(bursary.id)} className="text-xs font-black text-ink/60">Remove</button>
                    </div>
                    <p className="mt-2 text-xs text-ink/60">{bursary.applicationWindow ?? "Check the official page for the current window."}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-ink/65">Save bursaries here to build a shortlist and keep track of reminders.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-black">Upcoming reminders</h2>
            {reminderAlerts.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/75">
                {reminderAlerts.map((item) => (
                  <li key={item.bursary.id} className="rounded-lg bg-chalk p-3">
                    <p className="font-black">{item.bursary.name}</p>
                    <p className="text-xs font-semibold text-ink/55">
                      Deadline {formatDeadline(item.bursary.deadline)} · reminder {item.daysBeforeDeadline} days before
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-ink/65">No reminder is due yet. Set reminders on bursary cards to track closing dates.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-black">How to use this page</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/75">
              <li>Search by bursary name, provider, field, or keyword.</li>
              <li>Filter by funding type, study level, province, and live status.</li>
              <li>Save bursaries for later and set a reminder before the closing date.</li>
              <li>Check the official page and source page when the deadline is missing or outdated.</li>
              <li>The score badge is a learner-fit estimate, not a formal decision.</li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold">{label}<span className="mt-2 block">{children}</span></label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-bold text-ink/55">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-chalk p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function statusLabel(status: "open" | "closing" | "closed" | "unknown") {
  if (status === "open") return "Open";
  if (status === "closing") return "Closing soon";
  if (status === "closed") return "Closed";
  return "Check official page";
}

function badgeTone(status: "open" | "closing" | "closed" | "unknown") {
  if (status === "open") return "safe";
  if (status === "closing") return "watch";
  if (status === "closed") return "risk";
  return "sample";
}

function formatDeadline(deadline: string) {
  if (!deadline) return "Not listed";
  const time = new Date(deadline);
  return Number.isNaN(time.getTime()) ? "Not listed" : formatDate(deadline);
}

function matchesStudyLevel(levels: string[], filter: string) {
  const needle = filter.toLowerCase();
  return levels.some((level) => level.toLowerCase().includes(needle) || needle.includes(level.toLowerCase()));
}

function matchesFundingType(value: string, filter: string) {
  const lowerValue = value.toLowerCase();
  const lowerFilter = filter.toLowerCase();
  return lowerValue.includes(lowerFilter) || lowerFilter.includes(lowerValue);
}

function matchesFieldOfStudy(value: string, filter: string) {
  const lowerValue = value.toLowerCase();
  const lowerFilter = filter.toLowerCase();
  if (lowerValue.includes(lowerFilter) || lowerFilter.includes(lowerValue)) return true;
  return value.split("/").map((part) => part.trim().toLowerCase()).some((part) => part === lowerFilter || part.includes(lowerFilter));
}

async function loadServerReminderState() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  const response = await fetch("/api/bursary-reminders", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;

  const result = await response.json();
  const rows: Array<{ bursary_id: string; saved?: boolean; send_whatsapp?: boolean; days_before_deadline?: number }> = Array.isArray(result.data) ? result.data : [];
  const shortlist = rows.filter((row) => Boolean(row.saved)).map((row) => row.bursary_id);
  const reminders = Object.fromEntries(rows.filter((row) => Boolean(row.send_whatsapp) && row.days_before_deadline).map((row) => [row.bursary_id, Number(row.days_before_deadline)]));
  return { shortlist, reminders };
}

async function syncReminderState(shortlist: string[], reminders: Record<string, number>) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return false;

  const response = await fetch("/api/bursary-reminders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ shortlist, reminders })
  });

  if (!response.ok) {
    return false;
  }

  return true;
}
