import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-lg border border-ink/10 bg-white p-4 shadow-sm", className)}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "safe" | "watch" | "risk" | "sample" }) {
  const tones = {
    neutral: "bg-ink/10 text-ink",
    safe: "bg-veld/15 text-veld",
    watch: "bg-gold/25 text-amber-800",
    risk: "bg-protea/15 text-protea",
    sample: "bg-sky/15 text-sky"
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function ProgressBar({ value, target }: { value: number; target?: number }) {
  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-veld" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {target ? <p className="text-xs text-ink/60">Target {target}%</p> : null}
    </div>
  );
}

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="text-sm font-bold uppercase tracking-wide text-veld">{eyebrow}</p> : null}
      <h1 className="mt-1 text-2xl font-black tracking-normal text-ink md:text-4xl">{title}</h1>
      {children ? <div className="mt-2 max-w-3xl text-sm leading-6 text-ink/70 md:text-base">{children}</div> : null}
    </div>
  );
}
