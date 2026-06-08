import { describe, expect, it } from "vitest";
import { parseDirectoryCollections, parsePaperResources } from "@/lib/dbe-papers";

describe("DBE paper parsing", () => {
  it("extracts exam collections from the DBE directory section", () => {
    const collections = parseDirectoryCollections(`
      <h2>Previous exam papers (Gr 10, 11 &amp; 12)</h2>
      <a href="/LinkClick.aspx?link=2025NovemberExamPapers.aspx">2025 November NSC Examination Papers</a>
      <a href="/LinkClick.aspx?link=5475">2025 May/June NSC/SC Examination Papers</a>
      <h2>Contacts for enquiries</h2>
    `);

    expect(collections).toEqual([
      expect.objectContaining({ title: "2025 November NSC Examination Papers", year: 2025, examSession: "November", gradeScope: "Grade 12" }),
      expect.objectContaining({ title: "2025 May/June NSC/SC Examination Papers", year: 2025, examSession: "May/June", gradeScope: "Grade 12" })
    ]);
  });

  it("extracts paper and memo download resources by subject", () => {
    const resources = parsePaperResources(`
      <h2>Mathematics</h2>
      <a href="/title-paper">Paper 1 (English)</a><a href="/paper-download">Download</a>
      <a href="/title-memo">Memo 1 (Afrikaans and English)</a><a href="/memo-download">Download</a>
      <h2>Physical Sciences</h2>
      <a href="/title-p2">Paper 2 (Afrikaans)</a><a href="/paper2-download">Download</a>
    `);

    expect(resources).toEqual([
      expect.objectContaining({ subject: "Mathematics", title: "Paper 1 (English)", resourceType: "paper", paperNumber: "Paper 1", language: "English" }),
      expect.objectContaining({ subject: "Mathematics", title: "Memo 1 (Afrikaans and English)", resourceType: "memo", paperNumber: "Paper 1", language: "English & Afrikaans" }),
      expect.objectContaining({ subject: "Physical Sciences", title: "Paper 2 (Afrikaans)", resourceType: "paper", paperNumber: "Paper 2", language: "Afrikaans" })
    ]);
  });
});
