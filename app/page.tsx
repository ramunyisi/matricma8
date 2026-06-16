import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Users
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import matricLogo from "../matricsalogo.png";

const platformModules = [
  {
    title: "CAPS-aligned study coaching",
    text: "Subject-aware explanations, revision prompts, answer marking, and weak-topic memory for Grade 10-12 learners.",
    icon: Bot
  },
  {
    title: "APS and pathway planning",
    text: "Programme matching, what-if mark simulation, career-path guidance, and prospectus-backed university context.",
    icon: GraduationCap
  },
  {
    title: "DBE-linked paper practice",
    text: "Past-paper navigation with official source links, memo access, and direct practice routes into the study coach.",
    icon: BookOpen
  },
  {
    title: "Bursary and deadline support",
    text: "Bursary matching, application status tracking, WhatsApp reminders, and learner-friendly preparation checklists.",
    icon: CalendarClock
  }
];

const operatingModel = [
  "Learner dashboard for daily study, marks, APS and bursary progress",
  "Teacher/admin portal for verified content imports and classroom oversight",
  "Guardian view for progress, reminder settings, and consent-sensitive support",
  "Source-first content model that keeps official DBE, university, and bursary links visible"
];

const stakeholderOutcomes = [
  {
    title: "For schools",
    text: "A structured support layer for intervention, exam preparation, subject risk tracking, and learner accountability."
  },
  {
    title: "For districts",
    text: "A scalable digital channel for CAPS support, paper access, learner readiness, and application guidance."
  },
  {
    title: "For government partners",
    text: "A low-friction platform aligned to South African learner needs, public-source verification, and measurable participation."
  }
];

const readiness = [
  "Supabase authentication and role-aware learner, parent, teacher/admin surfaces",
  "Tested APS, bursary, coach-memory, CAPS, DBE paper, and reminder logic",
  "WhatsApp-ready reminder and coach workflows with opt-in controls",
  "Verified-data workflow hooks for prospectus, bursary, and DBE source updates"
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-chalk text-ink">
      <section className="relative min-h-[92vh] overflow-hidden bg-ink">
        <Image
          src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=2200&q=85"
          alt="South African classroom learning environment"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/72" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/20" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-white">
          <Link href="/" className="flex items-center gap-3">
            <Image src={matricLogo} alt="MatricSA logo" width={40} height={40} className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
            <div>
              <p className="text-base font-black tracking-tight">MatricSA</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Learner success platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white" href="/auth/login">
              Login
            </Link>
            <Link className="focus-ring rounded-lg bg-white px-4 py-2 text-sm font-black text-ink transition-opacity hover:opacity-90" href="/auth/signup">
              Request access
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[76vh] max-w-7xl flex-col justify-end px-4 pb-20 pt-12">
          <div className="max-w-4xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-gold backdrop-blur-sm">
              <Landmark size={14} />
              Built for schools, districts, and CAPS learners
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              MatricSA
            </h1>
            <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-white/82 md:text-2xl">
              A premium learner-success platform combining AI study support, APS planning, DBE-linked practice, bursary guidance, and accountable school workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 font-black text-ink transition-opacity hover:opacity-90">
                Request institutional access <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="focus-ring rounded-lg border border-white/35 px-5 py-3 font-black text-white backdrop-blur-sm transition-colors hover:bg-white/10">
                View platform demo
              </Link>
            </div>
            <div className="mt-9 grid max-w-3xl gap-3 text-sm font-bold text-white/70 sm:grid-cols-3">
              <HeroMetric value="Grade 10-12" label="CAPS learner focus" />
              <HeroMetric value="DBE-linked" label="paper and memo access" />
              <HeroMetric value="Role-aware" label="learner, parent, teacher/admin" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/[.08] bg-white py-8">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 md:grid-cols-4">
          {["CAPS-aligned support", "Prospectus-backed guidance", "WhatsApp-ready reminders", "Verified-source workflow"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm font-black text-ink/70">
              <CheckCircle2 size={16} className="text-veld" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader
            eyebrow="Platform modules"
            title="A complete learner-support system, not a single-purpose chatbot"
            text="MatricSA is designed around the actual decision points learners, teachers, and families face: daily revision, exam readiness, programme eligibility, applications, and deadlines."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {platformModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.title} className="min-h-56">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-5 text-lg font-black">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/62">{module.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <Badge tone="sample">Institutional readiness</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Designed for accountable rollout</h2>
            <p className="mt-5 text-base leading-7 text-white/65">
              Schools and departments need more than a polished learner interface. MatricSA includes role separation, source visibility, reminder controls, and teacher-facing workflows that support formal pilots.
            </p>
          </div>
          <div className="grid gap-3">
            {operatingModel.map((item) => (
              <div key={item} className="rounded-lg border border-white/12 bg-white/[.06] p-4 text-sm font-semibold leading-6 text-white/78">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader
            eyebrow="Stakeholder value"
            title="Clear benefits for every adoption conversation"
            text="The platform is positioned for classroom use, learner self-service, parent support, and district-level programme alignment."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stakeholderOutcomes.map((outcome) => (
              <Card key={outcome.title}>
                <Building2 className="text-veld" size={22} />
                <h3 className="mt-4 text-xl font-black">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/62">{outcome.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/[.08] bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeader
              eyebrow="Pilot readiness"
              title="Built with the controls expected in a formal school pilot"
              text="The current implementation already separates learner, parent, and admin experiences, and includes tested core logic for the main education workflows."
            />
            <div className="mt-6 grid gap-3">
              {readiness.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-chalk p-4 text-sm font-semibold leading-6 text-ink/72">
                  <ShieldCheck className="mt-0.5 shrink-0 text-veld" size={18} />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-ink/[.08] bg-ink p-6 text-white shadow-elevated">
            <p className="text-sm font-black uppercase tracking-widest text-gold">Implementation view</p>
            <div className="mt-6 grid gap-4">
              <ImplementationMetric icon={<Users />} value="Learner, guardian, teacher/admin" label="role-aware experiences" />
              <ImplementationMetric icon={<FileText />} value="DBE, university, bursary" label="source-visible content layers" />
              <ImplementationMetric icon={<BarChart3 />} value="APS, pathways, progress" label="decision-support dashboards" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-lg bg-white p-6 shadow-card md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-veld">Next step</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Prepare MatricSA for a school or government pilot</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62 md:text-base">
                  Use the demo workspace to review learner workflows, then configure verified content, pilot schools, reminder policy, and reporting expectations.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/auth/signup" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 font-black text-white">
                  Request access <ArrowRight size={18} />
                </Link>
                <Link href="/classroom" className="focus-ring rounded-lg border border-ink/15 px-5 py-3 font-black text-ink">
                  Teacher view
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/[.08] p-3 backdrop-blur-sm">
      <p className="text-base font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-white/52">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-widest text-veld">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-ink md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/62">{text}</p>
    </div>
  );
}

function ImplementationMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[.06] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-gold">{icon}</span>
        <div>
          <p className="font-black">{value}</p>
          <p className="mt-1 text-sm font-semibold text-white/55">{label}</p>
        </div>
      </div>
    </div>
  );
}
