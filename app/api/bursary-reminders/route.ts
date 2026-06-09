import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth-server";

const payloadSchema = z.object({
  shortlist: z.array(z.string().uuid()).default([]),
  reminders: z.record(z.string().uuid(), z.number().int().min(1).max(120)).default({})
});

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("learner_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await auth.supabase
    .from("bursary_reminders")
    .select("bursary_id,saved,send_whatsapp,days_before_deadline")
    .eq("learner_id", profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = payloadSchema.parse(await request.json());
  const { data: profile, error: profileError } = await auth.supabase
    .from("learner_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Learner profile not found." }, { status: 404 });
  }

  const shortlistSet = new Set(body.shortlist);
  const reminderEntries = Object.entries(body.reminders);

  const { data: existingRows, error: existingError } = await auth.supabase
    .from("bursary_reminders")
    .select("bursary_id")
    .eq("learner_id", profile.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  const toDelete = (existingRows ?? [])
    .map((row) => row.bursary_id)
    .filter((bursaryId) => !shortlistSet.has(bursaryId));

  if (toDelete.length > 0) {
    const { error: deleteError } = await auth.supabase
      .from("bursary_reminders")
      .delete()
      .eq("learner_id", profile.id)
      .in("bursary_id", toDelete);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  if (shortlistSet.size > 0) {
    const rows = Array.from(shortlistSet).map((bursaryId) => {
      const reminderDays = body.reminders[bursaryId];
      return {
        learner_id: profile.id,
        bursary_id: bursaryId,
        saved: true,
        send_whatsapp: Boolean(reminderDays),
        days_before_deadline: reminderDays ?? null,
        updated_at: new Date().toISOString()
      };
    });

    const { error: upsertError } = await auth.supabase
      .from("bursary_reminders")
      .upsert(rows, { onConflict: "learner_id,bursary_id" });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ data: { saved: shortlistSet.size, reminders: reminderEntries.length } });
}
