import Link from "next/link";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    packageCode: "NIWASTHAN_STARTER",
    eyebrow: "Discover your home",
    price: "₹199",
    description:
      "A low-friction first step for homeowners who want to see whether Niwasthan truly understands their space.",
    cta: "Discover My Home",
    featured: false,
    features: [
      "Create a Home Project",
      "Upload floor plan, photos & requirements",
      "AI-powered Home Understanding",
      "Basic room & space analysis",
      "Discover your Home Design Personality",
      "3 personalised design directions",
      "Initial room recommendations",
      "Guided AI design conversation",
      "Initial material & style suggestions",
      "Personalised Home Snapshot",
    ],
  },
  {
    name: "Design",
    packageCode: "NIWASTHAN_DESIGN",
    eyebrow: "Design your home",
    price: "₹999",
    description:
      "The sweet spot for homeowners ready to compare, refine and make confident room-level design decisions.",
    cta: "Design My Home",
    featured: true,
    features: [
      "Everything in Starter",
      "Full design intelligence",
      "Multiple room-level directions",
      "Compare directions side by side",
      "Accept, reject and revise decisions",
      "Replace, upgrade or downgrade elements",
      "Lock approved decisions",
      "Design version history",
      "Product & material recommendations",
      "Better-value, premium & budget alternatives",
      "Material comparisons",
      "Initial price/value intelligence",
      "Selected What-If scenarios",
      "Initial savings intelligence",
      "Design Battle & Niwasthan Finds",
      "Stronger project-aware Assistant",
    ],
  },
  {
    name: "Home Book",
    packageCode: "NIWASTHAN_HOME_BOOK",
    eyebrow: "Plan with confidence",
    price: "₹2,599",
    description:
      "Turn your approved design into a practical project record with costs, quantities, alternatives and buildability checks.",
    cta: "Build My Home Book",
    featured: false,
    features: [
      "Everything in Design",
      "Complete Home Book",
      "Approved designs & decisions",
      "Persistent products, materials & specifications",
      "Detailed BOQ",
      "Room-wise costing",
      "Material, component & product quantities",
      "Labour & services",
      "Budget allocation & cost-driver analysis",
      "What-If cost impact",
      "Upgrade/downgrade analysis",
      "Alternatives & substitutions",
      "Better Deals & savings intelligence",
      "Reality Check for spatial & buildability risks",
      "Before-you-buy checks",
      "Exportable project record",
    ],
  },
  {
    name: "Immersive",
    packageCode: "NIWASTHAN_IMMERSIVE",
    eyebrow: "Enter your future home",
    price: "₹9,999",
    description:
      "Experience the approved design as a spatial home—not just a pretty image—with human-scale movement and cinematic presentation.",
    cta: "Enter My Future Home",
    featured: false,
    features: [
      "Everything in Home Book",
      "Approved design → spatial 3D home",
      "Actual apartment layout",
      "Verified spatial dimensions",
      "Persistent walls, doors & windows",
      "Human-scale proportions",
      "First-person navigation",
      "Room-to-room movement",
      "Explore every corner",
      "Furniture, materials, finishes & lighting",
      "Cinematic walkthrough",
      "360° walkthrough",
      "Recording/export where supported",
      "Future VR/AR pathway",
    ],
  },
] as const;

export const metadata = {
  title: "Plans | Niwasthan",
  description:
    "Discover, design, plan and experience your home with Niwasthan. Choose the level of intelligence and immersion you need.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0a] text-[#f4efe6]">
      <header className="border-b border-[#d6b477]/15 px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" className="font-display text-2xl tracking-[-0.04em]">
            Niwasthan
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-[#d6b477]/35 px-5 py-2.5 font-body text-xs font-semibold text-[#f1d29a] transition-colors hover:bg-[#d6b477]/10"
          >
            Start your home
          </Link>
        </div>
      </header>

      <section className="px-5 pb-16 pt-24 md:px-10 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-5xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
              Choose your journey
            </p>
            <h1 className="mt-6 font-display text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.8] tracking-[-0.065em]">
              Discover.
              <br />
              <span className="text-[#d6b477]">Design.</span>
              <br />
              Experience.
            </h1>
            <p className="mt-10 max-w-2xl font-body text-base leading-relaxed text-white/55 md:text-xl">
              Start small, go deeper when you are ready. Every step is designed
              to give you more clarity and more control over the home you are
              creating.
            </p>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-7 md:p-8 ${
                  plan.featured
                    ? "border-[#d6b477]/60 bg-[#17140f] shadow-2xl shadow-[#d6b477]/10"
                    : "border-white/10 bg-[#11100e]"
                }`}
              >
                {plan.featured ? (
                  <div className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-[#d6b477] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#11100e]">
                    <Sparkles size={11} /> Most popular
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#d6b477]/75">
                      {plan.eyebrow}
                    </p>
                    <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em]">
                      Niwasthan {plan.name}
                    </h2>
                  </div>
                  {plan.name === "Immersive" ? (
                    <Crown className="shrink-0 text-[#d6b477]" size={22} />
                  ) : null}
                </div>

                <div className="mt-8">
                  <span className="font-display text-5xl font-semibold tracking-[-0.05em]">
                    {plan.price}
                  </span>
                  <span className="ml-2 font-body text-xs text-white/35">
                    one-time
                  </span>
                </div>

                <p className="mt-5 min-h-[92px] font-body text-sm leading-relaxed text-white/50">
                  {plan.description}
                </p>

                <Link
                  href={`/sign-in?callbackUrl=${encodeURIComponent(`/checkout?package=${plan.packageCode}`)}`}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-body text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    plan.featured
                      ? "bg-[#d6b477] text-[#11100e]"
                      : "border border-[#d6b477]/35 text-[#f4efe6]"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={15} />
                </Link>

                <div className="my-7 h-px bg-[#d6b477]/12" />
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                  Included
                </p>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 font-body text-sm leading-snug text-white/65"
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-[#d6b477]"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-5 rounded-[1.75rem] border border-[#d6b477]/15 bg-[#11100e] p-7 md:grid-cols-3 md:p-9">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#d6b477]">
                The ladder
              </p>
              <p className="mt-3 font-display text-2xl tracking-[-0.03em]">
                ₹199 Discover → ₹999 Design → ₹2,599 Plan → ₹9,999 Experience
              </p>
            </div>
            <div className="md:col-span-2 md:border-l md:border-[#d6b477]/15 md:pl-9">
              <p className="font-body text-sm leading-relaxed text-white/50 md:text-base">
                <strong className="font-semibold text-white/75">
                  More Options. Better Options. Better Deals. Better Decisions.
                </strong>{" "}
                Every plan builds on the same home context, so your decisions
                remain connected instead of starting again from scratch.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-[#d6b477]/15 pt-7">
            <p className="font-body text-xs text-white/35">
              Prices shown are one-time plan prices. Product, material,
              execution and third-party charges are separate where applicable.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#d6b477]"
            >
              Back to Niwasthan <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
