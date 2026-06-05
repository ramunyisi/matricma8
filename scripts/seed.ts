import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { sampleApsRules, sampleBursaries, sampleSubjects } from "@/lib/sample-data";

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
      sampleBursaries.map((bursary) => ({
        name: bursary.name,
        provider: bursary.provider,
        field_of_study: bursary.fieldOfStudy,
        min_average: bursary.minAverage,
        min_subject_requirements_json: bursary.minSubjectRequirementsJson,
        province_requirements: bursary.provinceRequirements,
        citizenship_requirements: bursary.citizenshipRequirements,
        deadline: bursary.deadline,
        application_url: bursary.applicationUrl,
        required_documents_json: bursary.requiredDocumentsJson,
        source_url: bursary.sourceUrl,
        last_verified_at: bursary.lastVerifiedAt
      }))
    )
  );

  console.log("Seeded MatricMate SA sample subjects, APS rules, and bursaries.");
}

async function assertOk(label: string, promise: PromiseLike<{ error: unknown }>) {
  const { error } = await promise;
  if (error) throw new Error(`${label} seed failed: ${JSON.stringify(error)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
