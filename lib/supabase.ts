import { createClient } from "@supabase/supabase-js";
import { mirroredSessionCookieName } from "@/lib/session-cookie";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function mirrorSessionForMiddleware(accessToken?: string | null) {
  if (typeof document === "undefined") return;
  if (!accessToken) {
    clearMirroredSession();
    return;
  }

  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${mirroredSessionCookieName}=1; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearMirroredSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${mirroredSessionCookieName}=; path=/; max-age=0; samesite=lax`;
}
