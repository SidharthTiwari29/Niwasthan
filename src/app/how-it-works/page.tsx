import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleDot } from "lucide-react";

export const metadata: Metadata = {
  title: "How Niwasthan Works",
  description:
    "See how Niwasthan connects your real home to design, materials, transparent costs and buildable execution.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How Niwasthan Works | From real home to better decisions",
    description:
      "A clearer way to understand, design, budget and build your home.",
    images: ["/hero/04-kitchen.webp"],
  },
};

const steps = [
  {
    number: "01",
    title: "Start with the real home",
    description:
      "Tell us what you are working with: the property, the people who use it, the way you live and the budget you want to stay honest about.",
    evidence: "Property profile · lifestyle brief · target budget",
  },
  {
    number: "02",
    title: "Understand the space",
    description:
      "Upload the floor plan, photos or measurements. Niwasthan keeps confirmed facts separate from inference, so you can review what is known before design begins.",
    evidence: "Floor plan · rooms · dimensions · confidence",
  },
  {
    number: "03",
    title: "Explore strong directions",
    description:
      "Move beyond one pretty render. Compare different design directions, understand the trade-offs and keep control of the decisions that matter to you.",
    evidence: "Design directions · revisions · locked decisions",
  },
  {
    number: "04",
    title: "See what it really costs",
    description:
      "Connect design choices to real products, materials, quantities and budget impact. See alternatives before the decision becomes expensive to reverse.",
    evidence: "Products · materials · BOQ · budget variance",
  },
  {
    number: "05",
    title: "Choose how to bring it to life",
    description:
      "Take the plan forward yourself or work with Niwasthan through procurement and execution. Your approved decisions remain the reference point.",
    evidence: "Quotes · procurement · execution · handover",
  },
];

const principles = [
  [
    "Real home first",
    "Your actual property is the source of truth wherever information has been confirmed.",
  ],
  [
    "No fabricated certainty",
    "Unknown, estimated and inferred information stays visibly different from verified facts.",
  ],
  [
    "Beautiful and buildable",
    "A cinematic image is an invitation to explore—not proof that a detail can be executed.",
  ],
  [
    "You stay in control",
    "Accept, reject, compare, modify, lock, upgrade, downgrade and revert important decisions.",
  ],
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0a] text-[#f4efe6]">
      <header className="border-b border-[#d6b477]/15 px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" className="font-display text-2xl tracking-[-0.04em]">
            Niwasthan
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="hidden rounded-full border border-white/15 px-4 py-2.5 font-body text-xs text-white/70 transition-colors hover:border-[#d6b477]/60 hover:text-white sm:block"
            >
              Plans
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full bg-[#d6b477] px-4 py-2.5 font-body text-xs font-semibold text-[#11100e] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Start your home
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 pb-24 pt-24 md:px-10 md:pb-36 md:pt-36">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/hero/04-kitchen.webp"
            alt="Warm, considered Niwasthan kitchen"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0a]/85 via-[#0b0b0a]/75 to-[#0b0b0a]" />
        <div className="relative mx-auto max-w-[1440px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} /> Back to Niwasthan
          </Link>
          <div className="mt-16 max-w-5xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
              How it works
            </p>
            <h1 className="mt-6 font-display text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.8] tracking-[-0.07em]">
              From a real home
              <br />
              <span className="text-[#d6b477]">to a better decision.</span>
            </h1>
            <p className="mt-10 max-w-2xl font-body text-base leading-relaxed text-white/65 md:text-xl">
              Niwasthan brings the important parts of building a home into one
              connected journey: spatial understanding, design intelligence,
              transparent choices, budget context and the freedom to decide how
              to execute.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-16 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
                The connected journey
              </p>
              <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-white/45">
                Every step builds on the same home context. You do not start
                again from scratch when you move from inspiration to design,
                from design to budget or from budget to execution.
              </p>
            </div>
            <div className="divide-y divide-[#d6b477]/15 border-y border-[#d6b477]/15">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-5 py-9 md:grid-cols-[80px_1fr] md:py-12"
                >
                  <span className="font-mono text-[10px] text-[#d6b477]">
                    {step.number}
                  </span>
                  <div>
                    <h2 className="font-display text-4xl font-semibold leading-[0.9] tracking-[-0.045em] md:text-6xl">
                      {step.title}
                    </h2>
                    <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-white/55 md:text-lg">
                      {step.description}
                    </p>
                    <p className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#d6b477]/75">
                      <CircleDot size={12} /> {step.evidence}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f2eee3] px-5 py-24 text-[#1c1a17] md:px-10 md:py-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#a8461f]">
              The Niwasthan standard
            </p>
            <h2 className="mt-6 font-display text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.84] tracking-[-0.065em]">
              Clarity is not a feature.
              <br />
              It is the foundation.
            </h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[1.75rem] border border-[#1c1a17]/10 bg-[#1c1a17]/10 md:grid-cols-2">
            {principles.map(([title, text]) => (
              <article key={title} className="bg-[#f2eee3] p-7 md:p-10">
                <div className="flex items-center gap-3">
                  <Check size={17} className="text-[#a8461f]" />
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.035em]">
                    {title}
                  </h3>
                </div>
                <p className="mt-5 max-w-md font-body text-sm leading-relaxed text-[#4a453e]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
            Your home starts with context
          </p>
          <h2 className="mt-6 max-w-4xl font-display text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.82] tracking-[-0.065em]">
            See it clearly.
            <br />
            <span className="text-[#d6b477]">Then decide.</span>
          </h2>
          <p className="mt-8 max-w-xl font-body text-base leading-relaxed text-white/55 md:text-lg">
            Explore the experience, choose a starting plan and bring your actual
            home into the conversation.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-[#d6b477] px-6 py-3.5 font-body text-sm font-semibold text-[#151310] transition-transform hover:-translate-y-0.5"
            >
              Start with your home <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[#d6b477]/35 px-6 py-3.5 font-body text-sm text-white/80 transition-colors hover:border-[#d6b477] hover:text-white"
            >
              Compare plans <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d6b477]/15 px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-xl">Niwasthan</span>
          <div className="flex gap-5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Plans
            </Link>
            <Link href="/sign-in" className="hover:text-white">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
