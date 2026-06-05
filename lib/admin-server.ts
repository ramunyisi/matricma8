import { createClient } from "@supabase/supabase-js";

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

export async function requireTeacherAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing auth token." };
  }

  const admin = getServiceSupabase();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false as const, status: 401, error: "Invalid auth token." };
  }

  const { data: appUser, error: roleError } = await admin
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (roleError || appUser?.role !== "teacher_admin") {
    return { ok: false as const, status: 403, error: "Teacher/admin role required." };
  }

  return { ok: true as const, admin, user: userData.user };
}
