import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, Calculator, Search } from "lucide-react";
import { Card } from "@/components/ui";
import matricLogo from "../matriclogo.png";

const features = [
  { title: "AI study coaching", text: "Simple explanations, 7-day planning, and mark-aware adjustments.", icon: Bot },
  { title: "APS prediction", text: "Configurable institution rules instead of one fixed formula.", icon: Calculator },
  { title: "Past-paper navigator", text: "Find DBE-linked practice by subject, topic, year, and difficulty.", icon: BookOpen },
  { title: "Bursary matching", text: "Match by marks, province, field of interest, documents, and deadlines.", icon: Search }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-chalk text-ink">
      <section className="relative min-h-[92vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=80"
          alt="Learners studying together"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/55" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-white">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-normal">
            <Image src={matricLogo} alt="MatricSA logo" width={34} height={34} className="h-8 w-8 rounded-lg object-contain" />
            <span>MatricSA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-bold hover:bg-white/10" href="/auth/login">Login</Link>
            <Link className="focus-ring rounded-lg bg-white px-3 py-2 text-sm font-black text-ink" href="/auth/signup">Get Started</Link>
          </div>
        </nav>
        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 pb-20 pt-8">
          <div className="max-w-3xl text-white">
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-gold">For South African CAPS learners</p>
            <h1 className="text-4xl font-black tracking-normal md:text-6xl">MatricSA</h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/90 md:text-2xl">
              Your AI study coach, APS predictor, past-paper navigator, and bursary matcher for South African Grade 10-12 learners.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 font-black text-ink">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="focus-ring rounded-lg border border-white/60 px-5 py-3 font-black text-white hover:bg-white/10">
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="-mt-16 pb-12">
        <div className="relative z-20 mx-auto grid max-w-7xl gap-3 px-4 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="min-h-40">
                <Icon className="text-veld" size={24} />
                <h2 className="mt-4 text-lg font-black">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/70">{feature.text}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
