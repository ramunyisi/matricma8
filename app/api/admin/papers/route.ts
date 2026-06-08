import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTeacherAdmin } from "@/lib/admin-server";

const BUCKET = "past-papers";

const uploadSchema = z.object({
  subjectId: z.string().uuid(),
  grade: z.coerce.number().int().min(10).max(12),
  year: z.coerce.number().int().min(2008),
  examSession: z.string().min(1),
  paperNumber: z.string().min(1),
  sourceName: z.string().min(1).default("Admin uploaded past paper"),
  sourceUrl: z.string().url().optional()
});

export async function POST(request: Request) {
  const auth = await requireTeacherAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const form = await request.formData();
  const body = uploadSchema.parse({
    subjectId: form.get("subjectId"),
    grade: form.get("grade"),
    year: form.get("year"),
    examSession: form.get("examSession"),
    paperNumber: form.get("paperNumber"),
    sourceName: form.get("sourceName") || "Admin uploaded past paper",
    sourceUrl: form.get("sourceUrl") || undefined
  });

  const paperFile = fileValue(form.get("paperFile"));
  const memoFile = fileValue(form.get("memoFile"));
  if (!paperFile) {
    return NextResponse.json({ error: "Past paper PDF is required." }, { status: 400 });
  }
  if (!memoFile) {
    return NextResponse.json({ error: "Solution memo PDF is required." }, { status: 400 });
  }

  try {
    await ensureBucket(auth.admin);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare paper storage." }, { status: 400 });
  }

  const basePath = [
    `grade-${body.grade}`,
    slug(body.year),
    slug(body.examSession),
    slug(body.paperNumber)
  ].join("/");

  const paperPath = `${basePath}/paper-${Date.now()}-${safeFileName(paperFile.name)}`;
  const memoPath = `${basePath}/memo-${Date.now()}-${safeFileName(memoFile.name)}`;

  const paperUpload = await uploadPdf(auth.admin, paperPath, paperFile);
  if (paperUpload.error) {
    return NextResponse.json({ error: paperUpload.error.message }, { status: 400 });
  }

  const memoUpload = await uploadPdf(auth.admin, memoPath, memoFile);
  if (memoUpload.error) {
    await auth.admin.storage.from(BUCKET).remove([paperPath]);
    return NextResponse.json({ error: memoUpload.error.message }, { status: 400 });
  }

  const paperUrl = `storage://${BUCKET}/${paperPath}`;
  const memoUrl = `storage://${BUCKET}/${memoPath}`;
  const { data, error } = await auth.admin.from("past_papers").insert({
    subject_id: body.subjectId,
    grade: body.grade,
    year: body.year,
    exam_session: body.examSession,
    paper_number: body.paperNumber,
    paper_url: paperUrl,
    memo_url: memoUrl,
    source_name: body.sourceName,
    source_url: body.sourceUrl ?? paperUrl
  }).select().single();

  if (error) {
    await auth.admin.storage.from(BUCKET).remove([paperPath, memoPath]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

async function ensureBucket(admin: SupabaseClient) {
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (bucket) return;

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 1024 * 40,
    allowedMimeTypes: ["application/pdf"]
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }
}

async function uploadPdf(admin: SupabaseClient, path: string, file: File) {
  return admin.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false
  });
}

function fileValue(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function safeFileName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned || "file"}.pdf`;
}

function slug(value: string | number) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "paper";
}
