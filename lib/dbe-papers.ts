import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const DBE_DIRECTORY_URL = "https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations.aspx";
const DBE_SOURCE_NAME = "Department of Basic Education NSC Past Examination Papers";

type DirectoryCollection = {
  title: string;
  sourceUrl: string;
  year: number;
  examSession: string;
  gradeScope: string;
};

type ResourceEntry = {
  subject: string;
  title: string;
  url: string;
  resourceType: "paper" | "memo" | "answerbook" | "addendum" | "data" | "other";
  paperNumber: string;
  language?: string;
};

type PaperImport = {
  subject: string;
  title: string;
  paperUrl: string;
  memoUrl?: string;
  paperNumber: string;
  language?: string;
};

export type DbeSyncSummary = {
  collectionsFound: number;
  collectionsSynced: number;
  papersUpserted: number;
  skippedCollections: string[];
};

export async function syncDbePastPaperDirectory(admin: SupabaseClient, options: { maxCollections?: number; grades?: number[] } = {}): Promise<DbeSyncSummary> {
  const directoryHtml = await fetchText(DBE_DIRECTORY_URL);
  const collections = parseDirectoryCollections(directoryHtml);
  const filteredCollections = options.grades?.length
    ? collections.filter((collection) => options.grades?.includes(gradeFromScope(collection.gradeScope)))
    : collections;
  const selectedCollections = options.maxCollections ? filteredCollections.slice(0, options.maxCollections) : filteredCollections;
  const summary: DbeSyncSummary = {
    collectionsFound: collections.length,
    collectionsSynced: 0,
    papersUpserted: 0,
    skippedCollections: []
  };

  for (const collection of selectedCollections) {
    try {
      const fetched = await fetchTextWithResolvedUrl(collection.sourceUrl);
      const html = fetched.text;
      const sourceUrl = fetched.url || collection.sourceUrl;
      const resolvedCollection = { ...collection, sourceUrl };
      await upsertCollection(admin, resolvedCollection);

      const entries = parsePaperResources(html);
      const papers = pairPapersWithMemos(entries);
      summary.papersUpserted += await replaceCollectionPapers(admin, resolvedCollection, papers);
      summary.collectionsSynced += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      summary.skippedCollections.push(`${collection.title}: ${reason}`);
    }
  }

  return summary;
}

export function parseDirectoryCollections(html: string): DirectoryCollection[] {
  const section = between(html, /Previous exam papers \(Gr 10, 11 &amp; 12\)|Previous exam papers \(Gr 10, 11 & 12\)/i, /Contacts for enquiries/i) ?? html;
  return extractAnchors(section)
    .map((anchor) => {
      const title = cleanText(anchor.text);
      const year = Number(title.match(/\b(20\d{2})\b/)?.[1] ?? title.match(/\b(200[89])\b/)?.[1]);
      if (!year || !/exam|paper|exemplar|common/i.test(title)) return null;
      return {
        title,
        sourceUrl: absoluteUrl(anchor.href, DBE_DIRECTORY_URL),
        year,
        examSession: examSessionFromTitle(title),
        gradeScope: gradeScopeFromTitle(title)
      } satisfies DirectoryCollection;
    })
    .filter((item): item is DirectoryCollection => Boolean(item));
}

export function parsePaperResources(html: string): ResourceEntry[] {
  const content = between(html, /LANGUAGES|NON LANGUAGES/i, /About Us|National Office|Copyright/i) ?? html;
  const headingAndAnchors = [...content.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>|<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const entries: ResourceEntry[] = [];
  let subject = "General";
  let pendingTitle: { text: string; href: string } | null = null;

  for (const match of headingAndAnchors) {
    if (match[1]) {
      const nextSubject = cleanText(match[1]);
      if (nextSubject && !/languages|non languages/i.test(nextSubject)) subject = nextSubject;
      pendingTitle = null;
      continue;
    }

    const href = attr(match[2] ?? "", "href");
    const text = cleanText(match[3] ?? "");
    if (!href || !text) continue;

    if (/^download$/i.test(text)) {
      if (pendingTitle) {
        entries.push(resourceFromTitle(subject, pendingTitle.text, absoluteUrl(href, DBE_DIRECTORY_URL)));
        pendingTitle = null;
      }
      continue;
    }

    if (/download/i.test(text)) continue;
    pendingTitle = { text, href };
  }

  return entries;
}

function pairPapersWithMemos(entries: ResourceEntry[]): PaperImport[] {
  const memos = entries.filter((entry) => entry.resourceType === "memo");
  return entries
    .filter((entry) => entry.resourceType === "paper")
    .map((paper) => {
      const memo = memos.find((candidate) =>
        candidate.subject === paper.subject &&
        candidate.paperNumber === paper.paperNumber &&
        (sameLanguage(candidate.language, paper.language) || isCombinedLanguage(candidate.language))
      ) ?? memos.find((candidate) => candidate.subject === paper.subject && candidate.paperNumber === paper.paperNumber);

      return {
        subject: paper.subject,
        title: paper.title,
        paperUrl: paper.url,
        memoUrl: memo?.url,
        paperNumber: paper.paperNumber,
        language: paper.language
      };
    });
}

async function upsertCollection(admin: SupabaseClient, collection: DirectoryCollection) {
  const payload = {
    title: collection.title,
    year: collection.year,
    exam_session: collection.examSession,
    grade_scope: collection.gradeScope,
    source_url: collection.sourceUrl,
    last_synced_at: new Date().toISOString()
  };

  const { data: existing, error: findError } = await admin
    .from("dbe_exam_collections")
    .select("id")
    .eq("source_url", collection.sourceUrl)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  const { error } = existing
    ? await admin.from("dbe_exam_collections").update(payload).eq("id", existing.id)
    : await admin.from("dbe_exam_collections").insert(payload);
  if (error) throw new Error(error.message);
}

async function replaceCollectionPapers(admin: SupabaseClient, collection: DirectoryCollection, papers: PaperImport[]) {
  if (papers.length === 0) return 0;

  const grade = gradeFromScope(collection.gradeScope);
  const subjects = await getSubjects(admin, [...new Set(papers.map((paper) => paper.subject))], grade);
  const rowsByExternalId = new Map<string, {
    grade: number;
    subject_id: string;
    year: number;
    exam_session: string;
    paper_number: string;
    paper_url: string;
    memo_url?: string;
    language?: string;
    collection_title: string;
    external_id: string;
    source_name: string;
    source_url: string;
  }>();

  for (const paper of papers) {
    const externalId = hash([collection.sourceUrl, paper.subject, paper.title, paper.paperUrl].join("|"));
    const subject = subjects.get(paper.subject);
    if (!subject) throw new Error(`Could not resolve subject ${paper.subject}.`);

    rowsByExternalId.set(externalId, {
      grade,
      subject_id: subject.id,
      year: collection.year,
      exam_session: collection.examSession,
      paper_number: paper.paperNumber,
      paper_url: paper.paperUrl,
      memo_url: paper.memoUrl,
      language: paper.language,
      collection_title: collection.title,
      external_id: externalId,
      source_name: DBE_SOURCE_NAME,
      source_url: collection.sourceUrl
    });
  }

  const rows = Array.from(rowsByExternalId.values());

  const externalIds = rows.map((row) => row.external_id);
  const { error: deleteError } = await admin.from("past_papers").delete().in("external_id", externalIds);
  if (deleteError) throw new Error(deleteError.message);

  for (const chunk of chunks(rows, 100)) {
    const { error } = await admin.from("past_papers").insert(chunk);
    if (error) throw new Error(error.message);
  }

  return rows.length;
}

async function getSubjects(admin: SupabaseClient, names: string[], grade: number) {
  const uniqueNames = [...new Set(names)];
  const { data: existing, error } = await admin
    .from("subjects")
    .select("id,name")
    .eq("grade", grade)
    .in("name", uniqueNames);
  if (error) throw new Error(error.message);

  const found = new Map((existing ?? []).map((subject) => [subject.name, subject]));
  const missing = uniqueNames.filter((name) => !found.has(name));
  if (missing.length > 0) {
    const { error: insertError } = await admin
      .from("subjects")
      .insert(missing.map((name) => ({ name, grade, curriculum: "CAPS" })));
    if (insertError) throw new Error(insertError.message);
  }

  const { data: allSubjects, error: reloadError } = await admin
    .from("subjects")
    .select("id,name")
    .eq("grade", grade)
    .in("name", uniqueNames);
  if (reloadError) throw new Error(reloadError.message);

  return new Map((allSubjects ?? []).map((subject) => [subject.name, subject]));
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function fetchText(url: string) {
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`Could not fetch DBE directory: HTTP ${response.status}`);
  return response.text();
}

async function fetchTextWithResolvedUrl(url: string) {
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return {
    text: await response.text(),
    url: response.url
  };
}

async function fetchWithRetry(url: string, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, { headers: requestHeaders() });
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(1000 * attempt);
    }
  }
  throw lastError;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestHeaders() {
  return {
    "User-Agent": "MatricSA/1.0 (+https://matricsa.local)",
    "Accept": "text/html,application/xhtml+xml"
  };
}

function extractAnchors(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[1], "href"),
    text: cleanText(match[2])
  })).filter((anchor) => anchor.href && anchor.text);
}

function resourceFromTitle(subject: string, title: string, url: string): ResourceEntry {
  return {
    subject: cleanText(subject),
    title,
    url,
    resourceType: resourceType(title),
    paperNumber: paperNumber(title),
    language: language(title)
  };
}

function resourceType(title: string): ResourceEntry["resourceType"] {
  if (/memo|memorandum|marking guideline/i.test(title)) return "memo";
  if (/answer\s*book|answerbook/i.test(title)) return "answerbook";
  if (/addendum/i.test(title)) return "addendum";
  if (/data files?/i.test(title)) return "data";
  if (/\b(paper|p)\s*[123]\b/i.test(title)) return "paper";
  return "other";
}

function paperNumber(title: string) {
  const match = title.match(/\b(?:paper|memo|memorandum|p)\s*([123])\b/i);
  return match ? `Paper ${match[1]}` : cleanText(title);
}

function language(title: string) {
  const text = title.toLowerCase();
  const hasEnglish = /\benglish\b/.test(text);
  const hasAfrikaans = /\bafrikaans\b/.test(text);
  if (hasEnglish && hasAfrikaans) return "English & Afrikaans";
  if (hasEnglish) return "English";
  if (hasAfrikaans) return "Afrikaans";
  return undefined;
}

function sameLanguage(a?: string, b?: string) {
  return cleanText(a ?? "").toLowerCase() === cleanText(b ?? "").toLowerCase();
}

function isCombinedLanguage(value?: string) {
  return Boolean(value && /&|and/i.test(value));
}

function examSessionFromTitle(title: string) {
  if (/may\/june|may june/i.test(title)) return "May/June";
  if (/feb\/march|february|march/i.test(title)) return "Feb/March";
  if (/november|oct\/nov|october/i.test(title)) return "November";
  if (/exemplar/i.test(title)) return "Exemplar";
  return "Other";
}

function gradeScopeFromTitle(title: string) {
  const grade = title.match(/\bgrade\s*(10|11|12)\b/i)?.[1];
  return grade ? `Grade ${grade}` : "Grade 12";
}

function gradeFromScope(value: string) {
  const grade = Number(value.match(/\b(10|11|12)\b/)?.[1] ?? 12);
  return grade === 10 || grade === 11 || grade === 12 ? grade : 12;
}

function cleanText(value: string) {
  return htmlDecode(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function htmlDecode(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function attr(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? "";
}

function absoluteUrl(href: string, base: string) {
  return new URL(htmlDecode(href), base).toString();
}

function between(value: string, start: RegExp, end: RegExp) {
  const startMatch = value.match(start);
  if (!startMatch || startMatch.index === undefined) return null;
  const rest = value.slice(startMatch.index);
  const endMatch = rest.match(end);
  return endMatch?.index === undefined ? rest : rest.slice(0, endMatch.index);
}

function hash(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex");
}
