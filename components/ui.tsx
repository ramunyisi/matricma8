import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-ink/[.07] bg-white p-5 shadow-card", className)}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "safe" | "watch" | "risk" | "sample";
}) {
  const tones = {
    neutral: "bg-ink/[.07] text-ink ring-ink/10",
    safe: "bg-veld/10 text-veld ring-veld/20",
    watch: "bg-gold/20 text-amber-800 ring-gold/25",
    risk: "bg-protea/10 text-protea ring-protea/20",
    sample: "bg-sky/10 text-sky ring-sky/20"
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1", tones[tone])}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, target }: { value: number; target?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/[.08]">
        <div
          className="h-full rounded-full bg-veld transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {target ? <p className="text-xs text-ink/50">Target {target}%</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-veld">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-black tracking-tight text-ink md:text-4xl">{title}</h1>
      {children ? (
        <div className="mt-2 max-w-3xl text-sm leading-6 text-ink/55 md:text-base">{children}</div>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral"
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "safe" | "watch" | "risk";
}) {
  const valueColor = {
    neutral: "text-ink",
    safe: "text-veld",
    watch: "text-amber-600",
    risk: "text-protea"
  }[tone];

  return (
    <div className="rounded-xl border border-ink/[.07] bg-white p-4 shadow-card">
      <p className="text-[11px] font-black uppercase tracking-widest text-ink/40">{label}</p>
      <p className={cn("mt-2 text-3xl font-black tabular-nums tracking-tight", valueColor)}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink/50">{sub}</p> : null}
    </div>
  );
}
