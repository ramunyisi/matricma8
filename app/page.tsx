import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, Calculator, CheckCircle2, Search } from "lucide-react";
import { Card } from "@/components/ui";
import matricLogo from "../matriclogo.png";

const features = [
  {
    title: "AI Study Coach",
    text: "CAPS-aligned explanations, worked examples, and a personalised 7-day study plan — for any topic you're struggling with.",
    icon: Bot,
    orb: "bg-veld/10 text-veld"
  },
  {
    title: "APS Predictor",
    text: "Configurable institution rules from real prospectuses. See which programmes you may qualify for.",
    icon: Calculator,
    orb: "bg-sky/10 text-sky"
  },
  {
    title: "Past-Paper Navigator",
    text: "DBE-linked practice papers by subject, year, and paper number. Memos included where available.",
    icon: BookOpen,
    orb: "bg-gold/15 text-amber-600"
  },
  {
    title: "Bursary Matcher",
    text: "Open bursaries matched by province, marks, and career interests — with WhatsApp deadline reminders.",
    icon: Search,
    orb: "bg-protea/10 text-protea"
  }
];

const trust = ["CAPS-aligned", "DBE-linked papers", "Grade 10 to 12", "SA context", "Free to start"];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-chalk text-ink">
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=80"
          alt="Learners studying together"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/70 via-ink/55 to-ink/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-white">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-black tracking-tight">
            <Image src={matricLogo} alt="MatricSA logo" width={34} height={34} className="h-8 w-8 rounded-lg object-contain" />
            <span>MatricSA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              href="/auth/login"
            >
              Login
            </Link>
            <Link
              className="focus-ring rounded-xl bg-white px-4 py-2 text-sm font-black text-ink transition-opacity hover:opacity-90"
              href="/auth/signup"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero content — anchored toward the bottom */}
        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pb-28 pt-8">
          <div className="max-w-2xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold backdrop-blur-sm">
              For South African CAPS Learners
            </div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
              Study smarter.<br />Score higher.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-white/75 md:text-xl">
              AI coaching, APS prediction, past papers, and bursary matching — built for SA Grade 10–12 learners.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/auth/signup"
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 font-black text-ink transition-opacity hover:opacity-90"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="focus-ring rounded-xl border border-white/35 px-5 py-3 font-black text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Try Demo
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-white/45">
              <span>Grade 10–12</span>
              <span aria-hidden="true">·</span>
              <span>CAPS-aligned</span>
              <span aria-hidden="true">·</span>
              <span>40+ subjects</span>
              <span aria-hidden="true">·</span>
              <span>100+ bursaries</span>
              <span aria-hidden="true">·</span>
              <span>Free to start</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="-mt-16 pb-12">
        <div className="relative z-20 mx-auto grid max-w-7xl gap-3 px-4 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="min-h-44">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${feature.orb}`}>
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-base font-black">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">{feature.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-ink py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4">
          {trust.map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm font-bold text-white/55">
              <CheckCircle2 size={14} className="text-veld" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
