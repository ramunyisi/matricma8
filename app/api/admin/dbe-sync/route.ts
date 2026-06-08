import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacherAdmin } from "@/lib/admin-server";
import { syncDbePastPaperDirectory } from "@/lib/dbe-papers";

const requestSchema = z.object({
  maxCollections: z.number().int().min(1).max(100).optional(),
  grades: z.array(z.number().int().min(10).max(12)).optional()
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireTeacherAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = requestSchema.parse(await request.json().catch(() => ({})));
  try {
    const summary = await syncDbePastPaperDirectory(auth.admin, body);
    return NextResponse.json({ data: summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not sync DBE papers." }, { status: 400 });
  }
}
