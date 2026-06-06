import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "Missing file parameter." }, { status: 400 });
  }

  const safeName = path.basename(file);
  const filePath = path.join(process.cwd(), "past_papers", safeName);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Paper file not found." }, { status: 404 });
  }

  const bytes = readFileSync(filePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName.replace(/"/g, "")}"`
    }
  });
}
