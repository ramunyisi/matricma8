import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { syncDbePastPaperDirectory } from "@/lib/dbe-papers";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running npm run import:dbe-papers.");
}

const maxArg = process.argv.find((arg) => arg.startsWith("--max="));
const maxCollections = maxArg ? Number(maxArg.replace("--max=", "")) : undefined;
const gradesArg = process.argv.find((arg) => arg.startsWith("--grades="));
const grades = gradesArg
  ? gradesArg.replace("--grades=", "").split(",").map((grade) => Number(grade.trim())).filter((grade) => [10, 11, 12].includes(grade))
  : undefined;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

syncDbePastPaperDirectory(supabase, { maxCollections: Number.isFinite(maxCollections) ? maxCollections : undefined, grades })
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
