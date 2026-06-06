import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running npm run import:papers.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const papersDir = path.join(process.cwd(), "past_papers");
const tmpDir = path.join(process.cwd(), "tmp", "paper-import");

async function main() {
  if (!existsSync(papersDir)) throw new Error(`Missing ${papersDir}`);
  mkdirSync(tmpDir, { recursive: true });

  const pdfs = readdirSync(papersDir).filter((file) => file.toLowerCase().endsWith(".pdf"));
  if (pdfs.length === 0) {
    console.log("No PDFs found in past_papers/.");
    return;
  }

  for (const file of pdfs) {
    await importPdf(path.join(papersDir, file));
  }
}

async function importPdf(pdfPath: string) {
  const fileName = path.basename(pdfPath);
  const metadata = parseFileName(fileName);
  const pageCount = getPageCount(pdfPath);
  const subject = await getSubject(metadata.subject, metadata.grade);
  const fileUrl = `local://past_papers/${encodeURIComponent(fileName)}`;

  const { data: existingPaper, error: existingPaperError } = await supabase
    .from("past_papers")
    .select("id")
    .eq("grade", metadata.grade)
    .eq("subject_id", subject.id)
    .eq("year", metadata.year)
    .eq("exam_session", metadata.examSession)
    .eq("paper_number", metadata.paperNumber)
    .eq("paper_url", fileUrl)
    .maybeSingle();

  if (existingPaperError) throw new Error(existingPaperError.message);

  const { data: paper, error: paperError } = existingPaper
    ? { data: existingPaper, error: null }
    : await supabase
    .from("past_papers")
    .insert({
      grade: metadata.grade,
      subject_id: subject.id,
      year: metadata.year,
      exam_session: metadata.examSession,
      paper_number: metadata.paperNumber,
      paper_url: fileUrl,
      memo_url: null,
      source_name: "Local uploaded past paper",
      source_url: fileUrl
    })
    .select("id")
    .single();

  if (paperError) throw new Error(`Could not create paper for ${fileName}: ${paperError.message}`);

  console.log(`Importing ${fileName} (${pageCount} pages)`);
  const pageTexts: Array<{ pageNumber: number; text: string }> = [];
  const renderPrefix = path.join(tmpDir, crypto.createHash("sha1").update(pdfPath).digest("hex"));
  rmGenerated(renderPrefix);
  execFileSync("pdftoppm", ["-r", "220", "-png", pdfPath, renderPrefix], { stdio: "ignore" });

  for (let page = 1; page <= pageCount; page += 1) {
    const imagePath = `${renderPrefix}-${String(page).padStart(2, "0")}.png`;
    const text = existsSync(imagePath) ? ocrImage(imagePath) : "";
    pageTexts.push({ pageNumber: page, text });
    const { error } = await supabase.from("paper_pages").upsert(
      {
        past_paper_id: paper.id,
        page_number: page,
        ocr_text: text
      },
      { onConflict: "past_paper_id,page_number" }
    );
    if (error) throw new Error(`Could not save OCR page ${page}: ${error.message}`);
  }

  const questions = detectQuestions(pageTexts);
  if (questions.length === 0) {
    console.log(`No question headings detected for ${fileName}. Pages imported for full-text search.`);
  }

  if (questions.length > 0) {
    await supabase.from("paper_questions").delete().eq("past_paper_id", paper.id);
  }

  for (const question of questions) {
    const { error } = await supabase.from("paper_questions").insert({
      past_paper_id: paper.id,
      question_number: question.questionNumber,
      difficulty: "medium",
      marks: question.marks,
      question_text_optional: question.text.slice(0, 3000),
      page_number: question.pageNumber,
      memo_page_number: null
    });
    if (error) throw new Error(`Could not save ${question.questionNumber}: ${error.message}`);
  }

  console.log(`Imported ${fileName}: ${pageTexts.length} OCR pages, ${questions.length} detected questions.`);
}

async function getSubject(name: string, grade: number) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id,name")
    .eq("name", name)
    .eq("grade", grade)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("subjects")
    .insert({ name, grade, curriculum: "CAPS" })
    .select("id,name")
    .single();

  if (createError) throw new Error(createError.message);
  return created;
}

function parseFileName(fileName: string) {
  const base = fileName.replace(/\.pdf$/i, "");
  const yearMatch = base.match(/\b(20\d{2})\b/);
  const paperMatch = base.match(/\bP(?:aper\s*)?([12])\b/i);
  const sessionMatch = base.match(/\b(Nov|November|June|May|March|Sept|September)\b/i);
  const subject = base.toLowerCase().includes("math") ? "Mathematics" : base.split(/\s+/)[0];

  return {
    subject,
    grade: 12,
    year: yearMatch ? Number(yearMatch[1]) : new Date().getFullYear(),
    examSession: normaliseSession(sessionMatch?.[1] ?? "November"),
    paperNumber: paperMatch ? `Paper ${paperMatch[1]}` : "Paper 1"
  };
}

function normaliseSession(value: string) {
  const lower = value.toLowerCase();
  if (lower.startsWith("nov")) return "November";
  if (lower.startsWith("sep")) return "September";
  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

function getPageCount(pdfPath: string) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`Could not determine page count for ${pdfPath}`);
  return Number(match[1]);
}

function ocrImage(imagePath: string) {
  return execFileSync("tesseract", [imagePath, "stdout", "-l", "eng", "--psm", "6"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  }).trim();
}

function detectQuestions(pages: Array<{ pageNumber: number; text: string }>) {
  const joined = pages.map((page) => `\n[[PAGE ${page.pageNumber}]]\n${page.text}`).join("\n");
  const matches = [...joined.matchAll(/(?:^|\n)\s*(QUESTION|Question)\s+(\d+)\b/g)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? joined.length;
    const chunk = joined.slice(start, end).trim();
    const pageMatch = joined.slice(0, start).match(/\[\[PAGE\s+(\d+)\]\](?![\s\S]*\[\[PAGE\s+\d+\]\])/);
    const marksMatch = chunk.match(/\[(\d+)\]/);
    return {
      questionNumber: `Question ${match[2]}`,
      pageNumber: pageMatch ? Number(pageMatch[1]) : 1,
      marks: marksMatch ? Number(marksMatch[1]) : null,
      text: chunk
    };
  });
}

function rmGenerated(prefix: string) {
  const dir = path.dirname(prefix);
  const base = path.basename(prefix);
  for (const file of readdirSync(dir)) {
    if (file.startsWith(base)) rmSync(path.join(dir, file), { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
