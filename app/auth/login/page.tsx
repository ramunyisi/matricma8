"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
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
        setMessage("Demo mode: Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable login.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password"))
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Supabase is not configured yet.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthCard title="Welcome back" message={message} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
}

function AuthCard({ title, message, isSubmitting, onSubmit }: { title: string; message: string; isSubmitting: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-chalk px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-veld text-white"><GraduationCap size={22} /></span>
          <div>
            <p className="text-sm font-bold text-veld">MatricMate SA</p>
            <h1 className="text-2xl font-black">{title}</h1>
          </div>
        </div>
        <label className="mt-6 block text-sm font-bold">Email</label>
        <input name="email" type="email" required className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-3" />
        <label className="mt-4 block text-sm font-bold">Password</label>
        <input name="password" type="password" required className="focus-ring mt-2 w-full rounded-lg border border-ink/15 px-3 py-3" />
        <button disabled={isSubmitting} className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-black text-white disabled:opacity-60">
          <LogIn size={18} /> {isSubmitting ? "Logging in..." : "Login"}
        </button>
        {message ? <p className="mt-4 rounded-lg bg-chalk p-3 text-sm text-ink/75">{message}</p> : null}
        <p className="mt-5 text-sm text-ink/70">
          New here? <Link className="font-black text-veld" href="/auth/signup">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
