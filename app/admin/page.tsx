"use client";

import { useEffect, useState } from "react";
import { BookPlus, Database, GraduationCap, ListPlus, RefreshCw, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Option = { id: string; name: string; grade?: number; label?: string };

export default function AdminPage() {
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const [papers, setPapers] = useState<Option[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refreshOptions();
  }, []);

  async function refreshOptions() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const [{ data: subjectRows }, { data: topicRows }, { data: paperRows }] = await Promise.all([
      supabase.from("subjects").select("id,name,grade").order("name"),
      supabase.from("topics").select("id,name,grade").order("name"),
      supabase.from("past_papers").select("id,year,exam_session,paper_number,subjects(name)").order("year", { ascending: false })
    ]);

    setSubjects((subjectRows ?? []).map((row) => ({ id: row.id, name: row.name, grade: row.grade, label: `${row.name} Grade ${row.grade}` })));
    setTopics((topicRows ?? []).map((row) => ({ id: row.id, name: row.name, grade: row.grade, label: `${row.name} Grade ${row.grade}` })));
    setPapers((paperRows ?? []).map((row) => {
      const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
      return { id: row.id, name: row.id, label: `${subject?.name ?? "Paper"} ${row.year} ${row.exam_session} ${row.paper_number}` };
    }));
  }

  async function submit(payload: Record<string, unknown>) {
    setIsSaving(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Login required.");

      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Admin save failed.");
      setMessage("Saved successfully.");
      await refreshOptions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save record.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPaperUpload(form: FormData) {
    setIsSaving(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Login required.");

      const response = await fetch("/api/admin/papers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Paper upload failed.");
      setMessage("Past paper and solution memo uploaded successfully.");
      await refreshOptions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload paper.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitDbeSync(form: FormData) {
    setIsSaving(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Login required.");

      const maxCollections = numberValue(form, "maxCollections");
      const grades = listValue(form, "grades").map((grade) => Number(grade)).filter((grade) => [10, 11, 12].includes(grade));
      const response = await fetch("/api/admin/dbe-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ maxCollections, grades: grades.length > 0 ? grades : undefined })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "DBE sync failed.");
      const summary = result.data;
      setMessage(`DBE sync complete: ${summary.papersUpserted} papers from ${summary.collectionsSynced} collection(s).`);
      await refreshOptions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sync DBE papers.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Teacher/Admin Portal" eyebrow="Verified content operations">
        Add content metadata and rules with source URLs. Admin writes are checked server-side against the teacher/admin role.
      </PageHeader>
      {message ? <div className="mb-4 rounded-lg bg-white p-3 text-sm font-bold text-ink shadow-sm">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminForm title="Sync DBE paper directory" icon={<RefreshCw />} badge="DBE links" disabled={isSaving} onSubmit={submitDbeSync}>
          <Input name="maxCollections" label="Collections to sync" type="number" defaultValue="3" />
          <Input name="grades" label="Grades" defaultValue="12" />
          <div className="rounded-lg bg-chalk p-3 text-sm font-semibold leading-6 text-ink/65 sm:col-span-2">
            Pulls DBE year/session pages into our searchable paper library while keeping downloads linked to DBE. Use comma-separated grades, for example 10,11.
          </div>
        </AdminForm>

        <AdminForm title="Add subject" icon={<GraduationCap />} badge="subjects" disabled={isSaving} onSubmit={(form) => submit({
          type: "subject",
          name: value(form, "name"),
          grade: numberValue(form, "grade"),
          curriculum: value(form, "curriculum") || "CAPS"
        })}>
          <Input name="name" label="Subject name" defaultValue="Mathematics" />
          <Select name="grade" label="Grade" options={["10", "11", "12"]} defaultValue="12" />
          <Input name="curriculum" label="Curriculum" defaultValue="CAPS" />
        </AdminForm>

        <AdminForm title="Add topic" icon={<ListPlus />} badge="topics" disabled={isSaving} onSubmit={(form) => submit({
          type: "topic",
          subjectId: value(form, "subjectId"),
          name: value(form, "name"),
          capsTerm: numberValue(form, "capsTerm"),
          grade: numberValue(form, "grade")
        })}>
          <OptionSelect name="subjectId" label="Subject" options={subjects} />
          <Input name="name" label="Topic name" defaultValue="Functions and graphs" />
          <Select name="capsTerm" label="CAPS term" options={["1", "2", "3", "4"]} defaultValue="1" />
          <Select name="grade" label="Grade" options={["10", "11", "12"]} defaultValue="12" />
        </AdminForm>

        <AdminForm title="Upload past paper and solution" icon={<Upload />} badge="paper files" disabled={isSaving} onSubmit={submitPaperUpload}>
          <OptionSelect name="subjectId" label="Subject" options={subjects} />
          <Select name="grade" label="Grade" options={["10", "11", "12"]} defaultValue="12" />
          <Input name="year" label="Year" type="number" defaultValue="2025" />
          <Input name="examSession" label="Exam session" defaultValue="November" />
          <Input name="paperNumber" label="Paper number" defaultValue="Paper 1" />
          <Input name="sourceName" label="Source name" defaultValue="Admin uploaded past paper" />
          <Input name="sourceUrl" label="Source URL" defaultValue="https://www.education.gov.za/?link=599&mid=1741&tabid=593" />
          <FileInput name="paperFile" label="Past paper PDF" />
          <FileInput name="memoFile" label="Solution memo PDF" />
        </AdminForm>

        <AdminForm title="Add past-paper metadata" icon={<BookPlus />} badge="papers" disabled={isSaving} onSubmit={(form) => submit({
          type: "pastPaper",
          subjectId: value(form, "subjectId"),
          grade: numberValue(form, "grade"),
          year: numberValue(form, "year"),
          examSession: value(form, "examSession"),
          paperNumber: value(form, "paperNumber"),
          paperUrl: value(form, "paperUrl"),
          memoUrl: value(form, "memoUrl") || undefined,
          sourceName: value(form, "sourceName"),
          sourceUrl: value(form, "sourceUrl")
        })}>
          <OptionSelect name="subjectId" label="Subject" options={subjects} />
          <Select name="grade" label="Grade" options={["10", "11", "12"]} defaultValue="12" />
          <Input name="year" label="Year" type="number" defaultValue="2024" />
          <Input name="examSession" label="Exam session" defaultValue="November" />
          <Input name="paperNumber" label="Paper number" defaultValue="Paper 1" />
          <Input name="paperUrl" label="Paper URL" defaultValue="https://www.education.gov.za/?link=599&mid=1741&tabid=593" />
          <Input name="memoUrl" label="Memo URL" defaultValue="https://www.education.gov.za/?link=599&mid=1741&tabid=593" />
          <Input name="sourceName" label="Source name" defaultValue="Department of Basic Education NSC Past Examination Papers" />
          <Input name="sourceUrl" label="Source URL" defaultValue="https://www.education.gov.za/?link=599&mid=1741&tabid=593" />
        </AdminForm>

        <AdminForm title="Add paper question metadata" icon={<BookPlus />} badge="questions" disabled={isSaving} onSubmit={(form) => submit({
          type: "paperQuestion",
          pastPaperId: value(form, "pastPaperId"),
          questionNumber: value(form, "questionNumber"),
          topicId: value(form, "topicId") || undefined,
          difficulty: value(form, "difficulty"),
          marks: numberValue(form, "marks"),
          pageNumber: numberValue(form, "pageNumber"),
          memoPageNumber: numberValue(form, "memoPageNumber")
        })}>
          <OptionSelect name="pastPaperId" label="Past paper" options={papers} />
          <Input name="questionNumber" label="Question number" defaultValue="Question 1.2" />
          <OptionSelect name="topicId" label="Topic" options={topics} includeBlank />
          <Select name="difficulty" label="Difficulty" options={["easy", "medium", "hard"]} defaultValue="medium" />
          <Input name="marks" label="Marks" type="number" defaultValue="10" />
          <Input name="pageNumber" label="Question page" type="number" defaultValue="5" />
          <Input name="memoPageNumber" label="Memo page" type="number" defaultValue="4" />
        </AdminForm>

        <AdminForm title="Add bursary" icon={<Database />} badge="bursaries" disabled={isSaving} onSubmit={(form) => submit({
          type: "bursary",
          name: value(form, "name"),
          provider: value(form, "provider"),
          fieldOfStudy: value(form, "fieldOfStudy"),
          fundingType: value(form, "fundingType") || undefined,
          studyLevels: listValue(form, "studyLevels"),
          eligibilityCriteriaJson: listValue(form, "eligibilityCriteria"),
          minAverage: numberValue(form, "minAverage"),
          minSubjectRequirementsJson: subjectRequirements(value(form, "subjectRequirements")),
          provinceRequirements: listValue(form, "provinceRequirements"),
          citizenshipRequirements: value(form, "citizenshipRequirements"),
          deadline: value(form, "deadline"),
          officialStatus: value(form, "officialStatus") as "open" | "closing" | "closed" | "unknown",
          applicationUrl: value(form, "applicationUrl"),
          requiredDocumentsJson: listValue(form, "requiredDocuments"),
          sourceUrl: value(form, "sourceUrl"),
          lastVerifiedAt: value(form, "lastVerifiedAt"),
          lastCheckedAt: value(form, "lastCheckedAt"),
          applicationWindow: value(form, "applicationWindow") || undefined,
          summary: value(form, "summary") || undefined,
          notes: value(form, "notes") || undefined
        })}>
          <Input name="name" label="Bursary name" defaultValue="Verified Example Bursary" />
          <Input name="provider" label="Provider" defaultValue="Provider name" />
          <Input name="fieldOfStudy" label="Field of study" defaultValue="Engineering" />
          <Input name="fundingType" label="Funding type" defaultValue="bursary" />
          <Input name="studyLevels" label="Study levels" defaultValue="undergraduate" />
          <Input name="eligibilityCriteria" label="Eligibility criteria" defaultValue="South African citizen,Financial need" />
          <Input name="minAverage" label="Minimum average" type="number" defaultValue="65" />
          <Input name="subjectRequirements" label="Subject requirements" defaultValue="Mathematics:60,Physical Sciences:60" />
          <Input name="provinceRequirements" label="Province requirements" defaultValue="All provinces" />
          <Input name="citizenshipRequirements" label="Citizenship requirements" defaultValue="South African citizen" />
          <Input name="deadline" label="Deadline" type="date" />
          <Select name="officialStatus" label="Official status" options={["open", "closing", "closed", "unknown"]} defaultValue="unknown" />
          <Input name="applicationUrl" label="Application URL" defaultValue="https://example.org/apply" />
          <Input name="requiredDocuments" label="Required documents" defaultValue="ID document,Latest school report" />
          <Input name="sourceUrl" label="Source URL" defaultValue="https://example.org/source" />
          <Input name="lastVerifiedAt" label="Last verified" type="date" />
          <Input name="lastCheckedAt" label="Last checked" type="date" />
          <Input name="applicationWindow" label="Application window" defaultValue="Open through the official portal." />
          <Input name="summary" label="Summary" defaultValue="Short description of the bursary." />
          <Input name="notes" label="Notes" defaultValue="Use the official portal for the current cycle." />
        </AdminForm>

        <AdminForm title="Add university APS rule" icon={<Database />} badge="APS rules" disabled={isSaving} onSubmit={(form) => submit({
          type: "apsRule",
          institutionName: value(form, "institutionName"),
          programmeName: value(form, "programmeName"),
          minimumTotal: numberValue(form, "minimumTotal"),
          minimumSubjectRequirementsJson: subjectRequirements(value(form, "subjectRequirements")),
          sourceUrl: value(form, "sourceUrl"),
          lastVerifiedAt: value(form, "lastVerifiedAt")
        })}>
          <Input name="institutionName" label="Institution name" defaultValue="Verified Example University" />
          <Input name="programmeName" label="Programme name" defaultValue="BSc Example Programme" />
          <Input name="minimumTotal" label="Minimum APS total" type="number" defaultValue="30" />
          <Input name="subjectRequirements" label="Subject requirements" defaultValue="Mathematics:60,English Home Language:50" />
          <Input name="sourceUrl" label="Source URL" defaultValue="https://example.edu/admissions" />
          <Input name="lastVerifiedAt" label="Last verified" type="date" />
        </AdminForm>
      </div>
      <Card className="mt-4">
        <h2 className="text-xl font-black">Learner progress summary</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">Next production step: aggregate learner progress by class and export CSV summaries for teachers.</p>
      </Card>
    </AppShell>
  );
}

function AdminForm({ title, icon, badge, children, disabled = false, onSubmit }: { title: string; icon: React.ReactNode; badge: string; children: React.ReactNode; disabled?: boolean; onSubmit: (form: FormData) => void }) {
  return (
    <Card>
      <form onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}>
        <div className="flex items-start justify-between gap-3">
          <span className="text-veld">{icon}</span>
          <Badge tone="sample">{badge}</Badge>
        </div>
        <h2 className="mt-4 text-xl font-black">{title}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
        <button disabled={disabled} className="focus-ring mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white disabled:opacity-60">Save</button>
      </form>
    </Card>
  );
}

function Input({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return <label className="text-sm font-bold">{label}<input className="input" name={name} type={type} defaultValue={defaultValue} /></label>;
}

function FileInput({ label, name }: { label: string; name: string }) {
  return <label className="text-sm font-bold">{label}<input className="input" name={name} type="file" accept="application/pdf,.pdf" required /></label>;
}

function Select({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue?: string }) {
  return <label className="text-sm font-bold">{label}<select className="input" name={name} defaultValue={defaultValue}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function OptionSelect({ label, name, options, includeBlank = false }: { label: string; name: string; options: Option[]; includeBlank?: boolean }) {
  return (
    <label className="text-sm font-bold">{label}
      <select className="input" name={name}>
        {includeBlank ? <option value="">None</option> : null}
        {options.map((option) => <option key={option.id} value={option.id}>{option.label ?? option.name}</option>)}
      </select>
    </label>
  );
}

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function numberValue(form: FormData, key: string) {
  const number = Number(form.get(key));
  return Number.isFinite(number) ? number : undefined;
}

function listValue(form: FormData, key: string) {
  return value(form, key).split(",").map((item) => item.trim()).filter(Boolean);
}

function subjectRequirements(input: string) {
  return input.split(",").map((item) => {
    const [subject, minMark] = item.split(":").map((part) => part.trim());
    return subject && Number.isFinite(Number(minMark)) ? { subject, minMark: Number(minMark) } : null;
  }).filter((item): item is { subject: string; minMark: number } => Boolean(item));
}
