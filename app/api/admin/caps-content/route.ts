import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTeacherAdmin } from "@/lib/admin-server";
import { extractCapsSectionsFromPdf } from "@/lib/caps-extractor";

const BUCKET = "caps-content";

const capsSectionSchema = z.object({
  subject: z.string().min(1),
  grade: z.union([z.literal("all"), z.coerce.number().int().min(10).max(12)]),
  term: z.coerce.number().int().min(1).max(4).optional(),
  topic: z.string().min(1),
  sectionTitle: z.string().min(1),
  sectionSummary: z.string().min(1),
  sectionText: z.string().min(1),
  sourceType: z.enum(["caps", "mind-the-gap", "workbook", "digital"]).default("mind-the-gap"),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
  pageStart: z.coerce.number().int().min(1).optional(),
  pageEnd: z.coerce.number().int().min(1).optional(),
  keywords: z.array(z.string()).default([]),
  version: z.coerce.number().int().min(1).default(1),
  lastVerifiedAt: z.string().optional()
});

const capsUploadSchema = z.object({
  subject: z.string().min(1),
  grade: z.union([z.literal("all"), z.coerce.number().int().min(10).max(12)]),
  term: z.coerce.number().int().min(1).max(4).optional(),
  topicHint: z.string().trim().min(1).optional(),
  sourceType: z.enum(["caps", "mind-the-gap", "workbook", "digital"]).default("mind-the-gap"),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
  capsSections: z.string().trim().optional()
});

export async function POST(request: Request) {
  try {
    const auth = await requireTeacherAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const form = await request.formData();
    const pdf = fileValue(form.get("capsPdf"));

    if (!pdf) {
      return NextResponse.json({ error: "CAPS PDF is required." }, { status: 400 });
    }

    const rawInput = capsUploadSchema.safeParse({
      subject: form.get("subject"),
      grade: form.get("grade"),
      term: optionalText(form.get("term")),
      topicHint: optionalText(form.get("topicHint")),
      sourceType: form.get("sourceType") ?? undefined,
      sourceTitle: form.get("sourceTitle"),
      sourceUrl: form.get("sourceUrl"),
      capsSections: optionalText(form.get("capsSections"))
    });

    if (!rawInput.success) {
      return NextResponse.json(
        {
          error: rawInput.error.issues.map((issue) => issue.message).join(" ")
        },
        { status: 400 }
      );
    }

    const { subject, grade, term, topicHint, sourceType, sourceTitle, sourceUrl, capsSections } = rawInput.data;
    const normalizedGrade: "all" | 10 | 11 | 12 = grade === "all" ? "all" : (grade as 10 | 11 | 12);

    let sections: z.infer<typeof capsSectionSchema>[];
    if (capsSections) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(capsSections);
      } catch {
        return NextResponse.json({ error: "CAPS chunks must be valid JSON." }, { status: 400 });
      }

      sections = z.array(capsSectionSchema).min(1).parse(parsed);
    } else {
      sections = await extractCapsSectionsFromPdf(Buffer.from(await pdf.arrayBuffer()), {
        subject,
        grade: normalizedGrade,
        term,
        topicHint,
        sourceType,
        sourceTitle,
        sourceUrl
      });

      if (sections.length === 0) {
        return NextResponse.json(
          {
            error:
              "No usable text was extracted from the PDF. If this is a scanned document, paste chunk JSON or run OCR first."
          },
          { status: 400 }
        );
      }
    }

    await ensureBucket(auth.admin);
    const path = `caps-${Date.now()}-${safeFileName(pdf.name)}`;
    const upload = await auth.admin.storage.from(BUCKET).upload(path, pdf, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false
    });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 400 });
    }

    const result = await auth.admin
      .from("caps_content_sections")
      .upsert(
        sections.map((section) => ({
          subject: section.subject,
          grade: section.grade === "all" ? null : section.grade,
          term: section.term ?? null,
          topic: section.topic,
          section_title: section.sectionTitle,
          section_summary: section.sectionSummary,
          section_text: section.sectionText,
          source_type: section.sourceType,
          source_title: sourceTitle || section.sourceTitle,
          source_url: sourceUrl || section.sourceUrl,
          page_start: section.pageStart ?? null,
          page_end: section.pageEnd ?? null,
          keywords: section.keywords,
          version: section.version,
          last_verified_at: section.lastVerifiedAt ?? null
        })),
        { onConflict: "source_url,section_title,version" }
      )
      .select();

    if (result.error) {
      await auth.admin.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: { uploaded: pdf.name, storagePath: path, sectionsImported: result.data?.length ?? 0 } });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not upload CAPS PDF."
      },
      { status: 500 }
    );
  }
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

function fileValue(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}

function safeFileName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned || "file"}.pdf`;
}
