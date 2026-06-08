import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getServiceSupabase } from "@/lib/admin-server";

const BUCKET = "past-papers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storagePath = searchParams.get("storagePath");
  if (storagePath) {
    return downloadStoragePdf(storagePath);
  }

  const file = searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "Missing file or storagePath parameter." }, { status: 400 });
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

async function downloadStoragePdf(storagePath: string) {
  const safePath = storagePath.split("/").filter((part) => part && part !== "." && part !== "..").join("/");
  if (!safePath) {
    return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(safePath);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Paper file not found." }, { status: 404 });
  }

  const bytes = await data.arrayBuffer();
  const safeName = path.basename(safePath).replace(/"/g, "");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`
    }
  });
}
