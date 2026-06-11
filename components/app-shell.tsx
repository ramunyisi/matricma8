"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { BellRing, BookOpen, Bot, Building2, Calculator, FileText, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, UserCircle, Route, X } from "lucide-react";
import { getLearnerProfile } from "@/lib/learner-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import matricLogo from "../matricsalogo.png";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study-coach", label: "Study Coach", icon: Bot },
  { href: "/caps-content", label: "CAPS Content", icon: FileText },
  { href: "/aps", label: "APS", icon: Calculator },
  { href: "/past-papers", label: "Past Papers", icon: BookOpen },
  { href: "/universities", label: "Universities", icon: Building2 },
  { href: "/bursaries", label: "Bursaries", icon: Search },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/pathways", label: "Pathways", icon: Route },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [needsLearnerProfile, setNeedsLearnerProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    setIsCheckingAuth(true);
    setAuthMessage("");
    setNeedsLearnerProfile(false);

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
        .maybeSingle();

      if (roleError && roleError.code !== "PGRST116") {
        throw new Error(roleError.message);
      }

      const metadataRole = data.user.user_metadata?.role as Role | undefined;
      const currentRole = (appUser?.role ?? metadataRole ?? "learner") as Role;
      setRole(currentRole);

      if (pathname === "/admin" && currentRole !== "teacher_admin") {
        setAuthMessage("Only teacher/admin accounts can access the admin portal.");
        setIsCheckingAuth(false);
        return;
      }

      if (currentRole === "learner" && pathname !== "/onboarding") {
        const profile = await getLearnerProfile(supabase, data.user.id);
        if (!profile) {
          setNeedsLearnerProfile(true);
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

  // Close drawer on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.replace("/");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const visibleNavItems = navItems.filter((item) => item.href !== "/admin" || role === "teacher_admin");

  return (
    <div className="min-h-screen bg-chalk">
      <header className="sticky top-0 z-40 border-b border-ink/[.07] bg-chalk/95 shadow-[0_1px_0_rgba(23,33,43,0.04)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center font-black tracking-tight text-ink">
            <Image src={matricLogo} alt="MatricSA logo" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            className="focus-ring rounded-lg border border-ink/10 p-2 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <nav className="hidden items-center gap-0.5 md:flex">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-veld/[.08] text-veld"
                      : "text-ink/60 hover:bg-white hover:text-ink"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <div className="ml-2 flex items-center gap-2 border-l border-ink/10 pl-3">
                <button
                  onClick={logout}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-black text-white transition-opacity hover:opacity-85"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>
      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          {/* Panel */}
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-white shadow-elevated">
            <div className="flex items-center justify-between border-b border-ink/[.07] px-4 py-3">
              <span className="font-black text-ink">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="focus-ring rounded-lg p-2 text-ink/50 hover:text-ink" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive ? "bg-veld/[.08] text-veld" : "text-ink/65 hover:bg-chalk hover:text-ink"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {user ? (
              <div className="border-t border-ink/[.07] p-3">
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="flex w-full items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-black text-white"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-5 pb-24 md:py-8 md:pb-8">
        {isCheckingAuth ? (
          <div className="grid min-h-[55vh] place-items-center">
            <div className="rounded-xl border border-ink/[.07] bg-white p-6 text-center shadow-card">
              <p className="font-black">Checking your session...</p>
              <p className="mt-2 text-sm text-ink/55">Loading MatricSA.</p>
            </div>
          </div>
        ) : authMessage ? (
          <div className="rounded-xl border border-protea/20 bg-protea/10 p-4 text-sm font-semibold text-ink">
            {authMessage}
          </div>
        ) : (
          <>
            {needsLearnerProfile ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm font-semibold text-ink">
                <span>Complete your learner profile to personalise study plans, APS estimates, and bursary matches.</span>
                <Link href="/onboarding" className="focus-ring rounded-xl bg-ink px-3.5 py-2.5 font-black text-white">
                  Set up profile
                </Link>
              </div>
            ) : null}
            {children}
          </>
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/[.07] bg-white/95 px-2 py-2 shadow-[0_-2px_12px_rgba(23,33,43,0.07)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {visibleNavItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition-colors",
                  isActive ? "text-veld" : "text-ink/50"
                )}
              >
                <Icon size={18} />
                <span>{item.label.replace("Past Papers", "Papers").replace("Universities", "Unis")}</span>
              </Link>
            );
          })}
        </div>
        {user ? (
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs font-black text-white"
          >
            <LogOut size={14} />
            Logout
          </button>
        ) : null}
      </nav>
    </div>
  );
}
