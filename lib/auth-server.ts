import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

export async function requireAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing auth token." };
  }

  const supabase = getServiceSupabase();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) {
    return { ok: false as const, status: 401, error: "Invalid auth token." };
  }

  return { ok: true as const, supabase, user: userData.user };
}

export type AuthenticatedUserResult = Awaited<ReturnType<typeof requireAuthenticatedUser>>;
export type ServiceSupabaseClient = SupabaseClient;
