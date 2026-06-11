import { PDFParse } from "pdf-parse";
import type { CapsContentSection } from "@/lib/types";

export type CapsExtractMetadata = {
  subject: string;
  grade: "all" | 10 | 11 | 12;
  sourceTitle: string;
  sourceUrl: string;
  topicHint?: string;
  sourceType?: "caps" | "mind-the-gap" | "workbook" | "digital";
  term?: number;
};

export async function extractCapsSectionsFromPdf(pdf: Buffer, metadata: CapsExtractMetadata): Promise<CapsContentSection[]> {
  const parser = new PDFParse({ data: pdf });
  try {
    const result = await parser.getText();
    return chunkCapsText(result.text, metadata);
  } finally {
    await parser.destroy();
  }
}

export function chunkCapsText(text: string, metadata: CapsExtractMetadata): CapsContentSection[] {
  const sourceType = metadata.sourceType ?? "mind-the-gap";
  const pages = text
    .split(/\f+/)
    .map((page) => page.trim())
    .filter(Boolean);

  const chunks: CapsContentSection[] = [];
  for (const [pageIndex, page] of pages.entries()) {
    const pageNumber = pageIndex + 1;
    const paragraphs = page
      .split(/\n\s*\n/)
      .map((paragraph) => normalize(paragraph))
      .filter(Boolean);

    if (paragraphs.length === 0) continue;

    let current = "";
    let chunkIndex = 0;
    for (const paragraph of paragraphs) {
      const next = current ? `${current}\n\n${paragraph}` : paragraph;
      if (current && next.length > 1200) {
        chunkIndex += 1;
        chunks.push(createSection(current, pageNumber, chunkIndex, metadata, sourceType));
        current = paragraph;
      } else {
        current = next;
      }
    }

    if (current) {
      chunkIndex += 1;
      chunks.push(createSection(current, pageNumber, chunkIndex, metadata, sourceType));
    }
  }

  return chunks;
}

function createSection(
  content: string,
  pageNumber: number,
  chunkIndex: number,
  metadata: CapsExtractMetadata,
  sourceType: "caps" | "mind-the-gap" | "workbook" | "digital"
): CapsContentSection {
  const heading = pickHeading(content, metadata.topicHint, metadata.sourceTitle);
  const sectionTitle = chunkIndex === 1 ? heading : `${heading} (${chunkIndex})`;
  const sectionSummary = summarize(content);
  const keywords = buildKeywords(content, metadata.subject, metadata.topicHint);

  return {
    subject: metadata.subject,
    grade: metadata.grade,
    term: metadata.term,
    topic: metadata.topicHint ?? heading,
    sectionTitle,
    sectionSummary,
    sectionText: content,
    sourceType,
    sourceTitle: metadata.sourceTitle,
    sourceUrl: metadata.sourceUrl,
    pageStart: pageNumber,
    pageEnd: pageNumber,
    keywords,
    version: 1,
    lastVerifiedAt: new Date().toISOString().slice(0, 10)
  };
}

function pickHeading(content: string, topicHint?: string, sourceTitle?: string) {
  const firstLine = content.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
  if (looksLikeHeading(firstLine)) return firstLine.slice(0, 120);
  if (topicHint) return topicHint;
  return sourceTitle ?? "CAPS section";
}

function looksLikeHeading(value: string) {
  if (!value) return false;
  if (value.length > 90) return false;
  if (/[.?!]$/.test(value)) return false;
  return /^[A-Z0-9\s,&()/-]+$/.test(value) || /^[A-Z][A-Za-z0-9\s,&()/-]+$/.test(value);
}

function summarize(value: string) {
  const sentence = value.split(/(?<=[.!?])\s+/)[0]?.trim() ?? value.trim();
  return sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence;
}

function buildKeywords(content: string, subject: string, topicHint?: string) {
  const stopWords = new Set(["the", "and", "with", "from", "that", "this", "their", "have", "into", "then", "than", "because", "where", "when", "your", "using", "used", "use", "page", "pages", "section", "question", "questions"]);
  const words = normalize(`${subject} ${topicHint ?? ""} ${content}`)
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word));
  return Array.from(new Set(words)).slice(0, 12);
}

function normalize(value: string) {
  return value.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}
