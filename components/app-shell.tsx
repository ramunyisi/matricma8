import Link from "next/link";
import { BookOpen, Bot, Calculator, GraduationCap, LayoutDashboard, Menu, Search, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study-coach", label: "Study Coach", icon: Bot },
  { href: "/aps", label: "APS", icon: Calculator },
  { href: "/past-papers", label: "Past Papers", icon: BookOpen },
  { href: "/bursaries", label: "Bursaries", icon: Search },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
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
            {navItems.map((item) => {
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 md:py-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white px-2 py-2 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold text-ink/70">
                <Icon size={18} />
                <span>{item.label.replace("Past Papers", "Papers")}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
