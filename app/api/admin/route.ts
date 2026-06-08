import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTeacherAdmin } from "@/lib/admin-server";

const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("subject"),
    name: z.string().min(1),
    grade: z.number().int().min(10).max(12),
    curriculum: z.string().min(1).default("CAPS")
  }),
  z.object({
    type: z.literal("topic"),
    subjectId: z.string().uuid(),
    name: z.string().min(1),
    capsTerm: z.number().int().min(1).max(4).optional(),
    grade: z.number().int().min(10).max(12)
  }),
  z.object({
    type: z.literal("pastPaper"),
    subjectId: z.string().uuid(),
    grade: z.number().int().min(10).max(12),
    year: z.number().int().min(2008),
    examSession: z.string().min(1),
    paperNumber: z.string().min(1),
    paperUrl: z.string().url(),
    memoUrl: z.string().url().optional(),
    sourceName: z.string().min(1),
    sourceUrl: z.string().url()
  }),
  z.object({
    type: z.literal("paperQuestion"),
    pastPaperId: z.string().uuid(),
    questionNumber: z.string().min(1),
    topicId: z.string().uuid().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    marks: z.number().int().min(0).optional(),
    pageNumber: z.number().int().min(0).optional(),
    memoPageNumber: z.number().int().min(0).optional()
  }),
  z.object({
    type: z.literal("bursary"),
    name: z.string().min(1),
    provider: z.string().min(1),
    fieldOfStudy: z.string().min(1),
    fundingType: z.string().optional(),
    studyLevels: z.array(z.string()).default([]),
    eligibilityCriteriaJson: z.array(z.string()).default([]),
    minAverage: z.number().min(0).max(100).optional(),
    minSubjectRequirementsJson: z.array(z.object({ subject: z.string(), minMark: z.number() })).default([]),
    provinceRequirements: z.array(z.string()).default(["All provinces"]),
    citizenshipRequirements: z.string().optional(),
    deadline: z.string().optional(),
    officialStatus: z.enum(["open", "closing", "closed", "unknown"]).default("unknown"),
    applicationUrl: z.string().url(),
    requiredDocumentsJson: z.array(z.string()).default([]),
    sourceUrl: z.string().url(),
    lastVerifiedAt: z.string().optional(),
    lastCheckedAt: z.string().optional(),
    applicationWindow: z.string().optional(),
    summary: z.string().optional(),
    notes: z.string().optional()
  }),
  z.object({
    type: z.literal("apsRule"),
    institutionName: z.string().min(1),
    programmeName: z.string().min(1),
    minimumTotal: z.number().int().min(0).optional(),
    minimumSubjectRequirementsJson: z.array(z.object({ subject: z.string(), minMark: z.number() })).default([]),
    sourceUrl: z.string().url(),
    lastVerifiedAt: z.string().optional()
  })
]);

export async function POST(request: Request) {
  const auth = await requireTeacherAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = requestSchema.parse(await request.json());
  const result = await insertAdminRecord(auth.admin, body);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.data });
}

async function insertAdminRecord(admin: SupabaseClient, body: z.infer<typeof requestSchema>) {
  switch (body.type) {
    case "subject":
      return admin.from("subjects").upsert({ name: body.name, grade: body.grade, curriculum: body.curriculum }, { onConflict: "name,grade,curriculum" }).select().single();
    case "topic":
      return admin.from("topics").upsert({ subject_id: body.subjectId, name: body.name, caps_term: body.capsTerm, grade: body.grade }, { onConflict: "subject_id,name,grade" }).select().single();
    case "pastPaper":
      return admin.from("past_papers").insert({
        subject_id: body.subjectId,
        grade: body.grade,
        year: body.year,
        exam_session: body.examSession,
        paper_number: body.paperNumber,
        paper_url: body.paperUrl,
        memo_url: body.memoUrl,
        source_name: body.sourceName,
        source_url: body.sourceUrl
      }).select().single();
    case "paperQuestion":
      return admin.from("paper_questions").insert({
        past_paper_id: body.pastPaperId,
        question_number: body.questionNumber,
        topic_id: body.topicId,
        difficulty: body.difficulty,
        marks: body.marks,
        page_number: body.pageNumber,
        memo_page_number: body.memoPageNumber
      }).select().single();
    case "bursary":
      return admin.from("bursaries").insert({
        name: body.name,
        provider: body.provider,
        field_of_study: body.fieldOfStudy,
        funding_type: body.fundingType,
        study_levels: body.studyLevels,
        eligibility_criteria_json: body.eligibilityCriteriaJson,
        min_average: body.minAverage,
        min_subject_requirements_json: body.minSubjectRequirementsJson,
        province_requirements: body.provinceRequirements,
        citizenship_requirements: body.citizenshipRequirements,
        deadline: body.deadline,
        official_status: body.officialStatus,
        application_url: body.applicationUrl,
        required_documents_json: body.requiredDocumentsJson,
        source_url: body.sourceUrl,
        last_verified_at: body.lastVerifiedAt,
        last_checked_at: body.lastCheckedAt,
        application_window: body.applicationWindow,
        summary: body.summary,
        notes: body.notes
      }).select().single();
    case "apsRule":
      return admin.from("aps_rules").upsert({
        institution_name: body.institutionName,
        programme_name: body.programmeName,
        rule_json: { method: "nsc_levels", includeLifeOrientation: false, minimumTotal: body.minimumTotal },
        minimum_subject_requirements_json: body.minimumSubjectRequirementsJson,
        source_url: body.sourceUrl,
        last_verified_at: body.lastVerifiedAt
      }, { onConflict: "institution_name,programme_name" }).select().single();
  }
}
