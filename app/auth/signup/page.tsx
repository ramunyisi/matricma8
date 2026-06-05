"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, UserPlus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function SignupPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Demo mode: Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable signup.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: String(form.get("email")),
        password: String(form.get("password")),
        options: { data: { role: form.get("role") } }
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      if (!data.session) {
        setMessage("Account created. Check your email to confirm your account, then log in to complete onboarding.");
        return;
      }
      router.replace("/onboarding");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Supabase is not configured yet.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-chalk px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-veld text-white"><GraduationCap size={22} /></span>
          <div>
            <p className="text-sm font-bold text-veld">MatricMate SA</p>
            <h1 className="text-2xl font-black">Create account</h1>
          </div>
        </div>
        <label className="mt-6 block text-sm font-bold">Role</label>
        <select name="role" className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-3">
          <option value="learner">Learner</option>
          <option value="parent">Parent/guardian</option>
          <option value="teacher_admin">Teacher/admin</option>
        </select>
        <label className="mt-4 block text-sm font-bold">Email</label>
        <input name="email" type="email" required className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-3" />
        <label className="mt-4 block text-sm font-bold">Password</label>
        <input name="password" type="password" minLength={8} required className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-3" />
        <button disabled={isSubmitting} className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-black text-white disabled:opacity-60">
          <UserPlus size={18} /> {isSubmitting ? "Creating account..." : "Sign up"}
        </button>
        {message ? <p className="mt-4 rounded-lg bg-chalk p-3 text-sm text-ink/75">{message}</p> : null}
        <p className="mt-5 text-sm text-ink/70">
          Already have an account? <Link className="font-black text-veld" href="/auth/login">Login</Link>
        </p>
        <Link className="mt-3 inline-block text-sm font-black text-sky" href="/onboarding">Continue to onboarding demo</Link>
      </form>
    </main>
  );
}
