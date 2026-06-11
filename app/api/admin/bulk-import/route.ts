import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTeacherAdmin } from "@/lib/admin-server";
import { syncDbePastPaperDirectory } from "@/lib/dbe-papers";

const apsRuleSchema = z.object({
  institutionName: z.string().min(1),
  programmeName: z.string().min(1),
  minimumTotal: z.number().int().min(0).optional(),
  minimumSubjectRequirementsJson: z.array(z.object({ subject: z.string().min(1), minMark: z.number().min(0).max(100) })).default([]),
  sourceUrl: z.string().url(),
  lastVerifiedAt: z.string().optional(),
  prospectusUrl: z.string().url().optional(),
  prospectusNotes: z.array(z.string()).default([])
});

const bursarySchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  fieldOfStudy: z.string().min(1),
  fundingType: z.string().optional(),
  studyLevels: z.array(z.string()).default([]),
  eligibilityCriteriaJson: z.array(z.string()).default([]),
  minAverage: z.number().min(0).max(100).optional(),
  minSubjectRequirementsJson: z.array(z.object({ subject: z.string().min(1), minMark: z.number().min(0).max(100) })).default([]),
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
});

const paperDirectorySchema = z.object({
  directoryUrl: z.string().url(),
  maxCollections: z.number().int().min(1).optional(),
  grades: z.array(z.number().int().min(10).max(12)).default([])
});

const capsSectionSchema = z.object({
  subject: z.string().min(1),
  grade: z.union([z.literal("all"), z.number().int().min(10).max(12)]).default("all"),
  term: z.number().int().min(1).max(4).optional(),
  topic: z.string().min(1),
  sectionTitle: z.string().min(1),
  sectionSummary: z.string().min(1),
  sectionText: z.string().min(1),
  sourceType: z.enum(["caps", "mind-the-gap", "workbook", "digital"]).default("mind-the-gap"),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
  pageStart: z.number().int().min(1).optional(),
  pageEnd: z.number().int().min(1).optional(),
  keywords: z.array(z.string()).default([]),
  version: z.number().int().min(1).default(1),
  lastVerifiedAt: z.string().optional()
});

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("apsRules"), items: z.array(apsRuleSchema).min(1) }),
  z.object({ type: z.literal("bursaries"), items: z.array(bursarySchema).min(1) }),
  z.object({ type: z.literal("paperDirectories"), items: z.array(paperDirectorySchema).min(1) }),
  z.object({ type: z.literal("capsSections"), items: z.array(capsSectionSchema).min(1) })
]);

export async function POST(request: Request) {
  const auth = await requireTeacherAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = requestSchema.parse(await request.json());

  if (body.type === "paperDirectories") {
    const summaries = [];
    for (const item of body.items) {
      const summary = await syncDbePastPaperDirectory(auth.admin, {
        directoryUrl: item.directoryUrl,
        maxCollections: item.maxCollections,
        grades: item.grades.length > 0 ? item.grades : undefined
      });
      summaries.push({ directoryUrl: item.directoryUrl, summary });
    }

    return NextResponse.json({ data: { type: body.type, summaries } });
  }

  if (body.type === "capsSections") {
    const results = [];
    for (const item of body.items) {
      const result = await upsertCapsSection(auth.admin, item);
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
      results.push(result.data);
    }
    return NextResponse.json({ data: { type: body.type, count: results.length, results } });
  }

  const results = [];
  for (const item of body.items) {
    const result = await upsertItem(auth.admin, body.type, item);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    results.push(result.data);
  }

  return NextResponse.json({ data: { type: body.type, count: results.length, results } });
}

async function upsertCapsSection(
  admin: SupabaseClient,
  item: z.infer<typeof capsSectionSchema>
) {
  const payload = {
    subject: item.subject,
    grade: item.grade === "all" ? null : item.grade,
    term: item.term ?? null,
    topic: item.topic,
    section_title: item.sectionTitle,
    section_summary: item.sectionSummary,
    section_text: item.sectionText,
    source_type: item.sourceType,
    source_title: item.sourceTitle,
    source_url: item.sourceUrl,
    page_start: item.pageStart ?? null,
    page_end: item.pageEnd ?? null,
    keywords: item.keywords,
    version: item.version,
    last_verified_at: item.lastVerifiedAt
  };

  return admin.from("caps_content_sections").upsert(payload, { onConflict: "source_url,section_title,version" }).select().single();
}

async function upsertItem(
  admin: SupabaseClient,
  type: "apsRules" | "bursaries",
  item: z.infer<typeof apsRuleSchema> | z.infer<typeof bursarySchema>
) {
  if (type === "apsRules") {
    const rule = item as z.infer<typeof apsRuleSchema>;
    return admin.from("aps_rules").upsert({
      institution_name: rule.institutionName,
      programme_name: rule.programmeName,
      rule_json: { method: "nsc_levels", includeLifeOrientation: false, minimumTotal: rule.minimumTotal },
      minimum_subject_requirements_json: rule.minimumSubjectRequirementsJson,
      source_url: rule.sourceUrl,
      last_verified_at: rule.lastVerifiedAt,
      prospectus_url: rule.prospectusUrl,
      prospectus_notes: rule.prospectusNotes
    }, { onConflict: "institution_name,programme_name" }).select().single();
  }

  const bursary = item as z.infer<typeof bursarySchema>;
  const payload = {
    name: bursary.name,
    provider: bursary.provider,
    field_of_study: bursary.fieldOfStudy,
    funding_type: bursary.fundingType,
    study_levels: bursary.studyLevels,
    eligibility_criteria_json: bursary.eligibilityCriteriaJson,
    min_average: bursary.minAverage,
    min_subject_requirements_json: bursary.minSubjectRequirementsJson,
    province_requirements: bursary.provinceRequirements,
    citizenship_requirements: bursary.citizenshipRequirements,
    deadline: bursary.deadline,
    official_status: bursary.officialStatus,
    application_url: bursary.applicationUrl,
    required_documents_json: bursary.requiredDocumentsJson,
    source_url: bursary.sourceUrl,
    last_verified_at: bursary.lastVerifiedAt,
    last_checked_at: bursary.lastCheckedAt,
    application_window: bursary.applicationWindow,
    summary: bursary.summary,
    notes: bursary.notes
  };

  const { data: existing, error: findError } = await admin
    .from("bursaries")
    .select("id")
    .eq("name", bursary.name)
    .eq("provider", bursary.provider)
    .maybeSingle();
  if (findError) return { data: null, error: findError };

  return existing
    ? admin.from("bursaries").update(payload).eq("id", existing.id).select().single()
    : admin.from("bursaries").insert(payload).select().single();
}
