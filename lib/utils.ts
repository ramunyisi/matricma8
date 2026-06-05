export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : String(error || "");
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (lower.includes("email not confirmed")) return "Please confirm your email address before logging in.";
  if (lower.includes("row-level security")) return "You do not have permission to perform this action.";
  if (lower.includes("network") || lower.includes("fetch")) return "Network connection failed. Check your internet and try again.";
  if (lower.includes("public.subjects") || lower.includes("missing seeded subjects")) return "The subject list is not ready yet. Run the Supabase seed script, then try again.";
  if (lower.includes("teacher/admin role required")) return "Only teacher/admin accounts can use this page.";
  if (message.trim()) return message;
  return fallback;
}
