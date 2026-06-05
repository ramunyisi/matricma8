"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { BookOpen, Bot, Calculator, GraduationCap, LayoutDashboard, LogOut, Menu, Search, ShieldCheck } from "lucide-react";
import { getLearnerProfile } from "@/lib/learner-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Role } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study-coach", label: "Study Coach", icon: Bot },
  { href: "/aps", label: "APS", icon: Calculator },
  { href: "/past-papers", label: "Past Papers", icon: BookOpen },
  { href: "/bursaries", label: "Bursaries", icon: Search },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setIsCheckingAuth(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (error || !data.user) {
        router.replace("/auth/login");
        return;
      }

      setUser(data.user);

      const { data: appUser, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (roleError) {
        throw new Error(roleError.message);
      }

      const currentRole = appUser.role as Role;
      setRole(currentRole);

      if (pathname === "/admin" && currentRole !== "teacher_admin") {
        router.replace("/dashboard");
        return;
      }

      if (currentRole === "learner" && pathname !== "/onboarding") {
        const profile = await getLearnerProfile(supabase, data.user.id);
        if (!profile) {
          router.replace("/onboarding");
          return;
        }
      }

      setIsCheckingAuth(false);
    }

    checkAuth().catch((error) => {
      setAuthMessage(error instanceof Error ? error.message : "Could not verify your session.");
      setIsCheckingAuth(false);
    });

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.replace("/");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  return (
    <div className="min-h-screen bg-chalk">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-chalk/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-veld text-white">
              <GraduationCap size={20} />
            </span>
            <span>MatricMate SA</span>
          </Link>
          <button className="focus-ring rounded-lg border border-ink/10 p-2 md:hidden" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.filter((item) => item.href !== "/admin" || role === "teacher_admin").map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-white hover:text-ink"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <div className="ml-2 flex items-center gap-2 border-l border-ink/10 pl-3">
                <span className="max-w-40 truncate text-sm font-semibold text-ink/65">{user.email}</span>
                <button onClick={logout} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-black text-white">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 md:py-8">
        {isCheckingAuth ? (
          <div className="grid min-h-[55vh] place-items-center">
            <div className="rounded-lg border border-ink/10 bg-white p-5 text-center shadow-sm">
              <p className="font-black">Checking your session...</p>
              <p className="mt-2 text-sm text-ink/60">Loading MatricMate SA.</p>
            </div>
          </div>
        ) : authMessage ? (
          <div className="rounded-lg border border-protea/20 bg-protea/10 p-4 text-sm font-semibold text-ink">{authMessage}</div>
        ) : (
          children
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white px-2 py-2 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).filter((item) => item.href !== "/admin" || role === "teacher_admin").map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold text-ink/70">
                <Icon size={18} />
                <span>{item.label.replace("Past Papers", "Papers")}</span>
              </Link>
            );
          })}
        </div>
        {user ? (
          <button onClick={logout} className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-black text-white">
            <LogOut size={14} />
            Logout
          </button>
        ) : null}
      </nav>
    </div>
  );
}
