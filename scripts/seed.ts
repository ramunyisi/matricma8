import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { capsContentSections } from "@/lib/caps-content";
import { sampleApsRules, sampleSubjects } from "@/lib/sample-data";
import { verifiedBursaries } from "@/lib/bursary-directory";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running npm run seed.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function main() {
  const subjects = sampleSubjects.flatMap((name) =>
    [10, 11, 12].map((grade) => ({ name, grade, curriculum: "CAPS" }))
  );

  await assertOk("subjects", supabase.from("subjects").upsert(subjects, { onConflict: "name,grade,curriculum" }));

  await assertOk(
    "aps_rules",
    supabase.from("aps_rules").upsert(
      sampleApsRules.map((rule) => ({
        institution_name: rule.institutionName,
        programme_name: rule.programmeName,
        rule_json: { ...rule.ruleJson, sampleData: true },
        minimum_subject_requirements_json: rule.minimumSubjectRequirementsJson,
        source_url: rule.sourceUrl,
        last_verified_at: rule.lastVerifiedAt
      })),
      { onConflict: "institution_name,programme_name" }
    )
  );

  await assertOk(
    "bursaries",
    supabase.from("bursaries").upsert(
      verifiedBursaries.map((bursary) => ({
        name: bursary.name,
        provider: bursary.provider,
        field_of_study: bursary.fieldOfStudy,
        min_average: bursary.minAverage,
        min_subject_requirements_json: bursary.minSubjectRequirementsJson,
        province_requirements: bursary.provinceRequirements,
        citizenship_requirements: bursary.citizenshipRequirements,
        deadline: bursary.deadline || null,
        application_url: bursary.applicationUrl,
        required_documents_json: bursary.requiredDocumentsJson,
        source_url: bursary.sourceUrl,
        last_verified_at: bursary.lastVerifiedAt
      }))
    )
  );

  await assertOk(
    "caps_content_sections",
    supabase.from("caps_content_sections").upsert(
      capsContentSections.map((section) => ({
        subject: section.subject,
        grade: section.grade === "all" ? null : section.grade,
        term: section.term ?? null,
        topic: section.topic,
        section_title: section.sectionTitle,
        section_summary: section.sectionSummary,
        section_text: section.sectionText,
        source_type: section.sourceType,
        source_title: section.sourceTitle,
        source_url: section.sourceUrl,
        page_start: section.pageStart ?? null,
        page_end: section.pageEnd ?? null,
        keywords: section.keywords,
        version: section.version,
        last_verified_at: section.lastVerifiedAt ?? null
      })),
      { onConflict: "source_url,section_title,version" }
    )
  );

  console.log("Seeded MatricSA sample subjects, APS rules, verified bursaries, and CAPS content sections.");
}

async function assertOk(label: string, promise: PromiseLike<{ error: unknown }>) {
  const { error } = await promise;
  if (error) throw new Error(`${label} seed failed: ${JSON.stringify(error)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
