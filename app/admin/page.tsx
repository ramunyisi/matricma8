"use client";

import { useEffect, useState } from "react";
import { BookPlus, Database, GraduationCap, ListPlus } from "lucide-react";
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

  return (
    <AppShell>
      <PageHeader title="Teacher/Admin Portal" eyebrow="Verified content operations">
        Add content metadata and rules with source URLs. Admin writes are checked server-side against the teacher/admin role.
      </PageHeader>
      {message ? <div className="mb-4 rounded-lg bg-white p-3 text-sm font-bold text-ink shadow-sm">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminForm title="Add subject" icon={<GraduationCap />} badge="subjects" onSubmit={(form) => submit({
          type: "subject",
          name: value(form, "name"),
          grade: numberValue(form, "grade"),
          curriculum: value(form, "curriculum") || "CAPS"
        })}>
          <Input name="name" label="Subject name" defaultValue="Mathematics" />
          <Select name="grade" label="Grade" options={["10", "11", "12"]} defaultValue="12" />
          <Input name="curriculum" label="Curriculum" defaultValue="CAPS" />
        </AdminForm>

        <AdminForm title="Add topic" icon={<ListPlus />} badge="topics" onSubmit={(form) => submit({
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

        <AdminForm title="Add past-paper metadata" icon={<BookPlus />} badge="papers" onSubmit={(form) => submit({
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

        <AdminForm title="Add paper question metadata" icon={<BookPlus />} badge="questions" onSubmit={(form) => submit({
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

        <AdminForm title="Add bursary" icon={<Database />} badge="bursaries" onSubmit={(form) => submit({
          type: "bursary",
          name: value(form, "name"),
          provider: value(form, "provider"),
          fieldOfStudy: value(form, "fieldOfStudy"),
          minAverage: numberValue(form, "minAverage"),
          minSubjectRequirementsJson: subjectRequirements(value(form, "subjectRequirements")),
          provinceRequirements: listValue(form, "provinceRequirements"),
          citizenshipRequirements: value(form, "citizenshipRequirements"),
          deadline: value(form, "deadline"),
          applicationUrl: value(form, "applicationUrl"),
          requiredDocumentsJson: listValue(form, "requiredDocuments"),
          sourceUrl: value(form, "sourceUrl"),
          lastVerifiedAt: value(form, "lastVerifiedAt")
        })}>
          <Input name="name" label="Bursary name" defaultValue="Verified Example Bursary" />
          <Input name="provider" label="Provider" defaultValue="Provider name" />
          <Input name="fieldOfStudy" label="Field of study" defaultValue="Engineering" />
          <Input name="minAverage" label="Minimum average" type="number" defaultValue="65" />
          <Input name="subjectRequirements" label="Subject requirements" defaultValue="Mathematics:60,Physical Sciences:60" />
          <Input name="provinceRequirements" label="Province requirements" defaultValue="All provinces" />
          <Input name="citizenshipRequirements" label="Citizenship requirements" defaultValue="South African citizen" />
          <Input name="deadline" label="Deadline" type="date" />
          <Input name="applicationUrl" label="Application URL" defaultValue="https://example.org/apply" />
          <Input name="requiredDocuments" label="Required documents" defaultValue="ID document,Latest school report" />
          <Input name="sourceUrl" label="Source URL" defaultValue="https://example.org/source" />
          <Input name="lastVerifiedAt" label="Last verified" type="date" />
        </AdminForm>

        <AdminForm title="Add university APS rule" icon={<Database />} badge="APS rules" onSubmit={(form) => submit({
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
      <style jsx>{`.input{margin-top:.5rem;width:100%;border-radius:.5rem;border:1px solid rgb(23 33 43 / .15);padding:.75rem;background:white}`}</style>
    </AppShell>
  );
}

function AdminForm({ title, icon, badge, children, onSubmit }: { title: string; icon: React.ReactNode; badge: string; children: React.ReactNode; onSubmit: (form: FormData) => void }) {
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
        <button className="focus-ring mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">Save</button>
      </form>
    </Card>
  );
}

function Input({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return <label className="text-sm font-bold">{label}<input className="input" name={name} type={type} defaultValue={defaultValue} /></label>;
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
