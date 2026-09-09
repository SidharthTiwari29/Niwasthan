import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  FileUp,
  House,
  Sparkles,
} from "lucide-react";

export type DashboardProperty = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  propertyType: string | null;
  targetBudgetMinor: number | null;
  roomCount: number;
  designCount: number;
};

const steps = [
  {
    key: "home",
    number: "01",
    title: "Tell us about your home",
    description:
      "Start with the real property, your priorities and the budget you want to stay honest about.",
    icon: House,
  },
  {
    key: "understand",
    number: "02",
    title: "Understand the space",
    description:
      "Upload a floor plan so rooms, dimensions and unknowns can be reviewed before design decisions.",
    icon: FileUp,
  },
  {
    key: "design",
    number: "03",
    title: "Shape the direction",
    description:
      "Compare design directions and move from a beautiful idea to an explainable, buildable plan.",
    icon: Compass,
  },
  {
    key: "decide",
    number: "04",
    title: "Know what happens next",
    description:
      "See materials, budget impact and execution choices before you commit to the next step.",
    icon: Sparkles,
  },
] as const;

function formatBudget(minor: number | null) {
  if (!minor) return "Budget not set";
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function getProgress(property: DashboardProperty) {
  if (property.designCount > 0) return 75;
  if (property.roomCount > 0) return 50;
  return 25;
}

function nextStep(property: DashboardProperty) {
  if (property.roomCount === 0)
    return {
      label: "Upload your floor plan",
      href: `/properties/${property.id}/floor-plan`,
    };
  if (property.designCount === 0)
    return { label: "Open your home", href: `/properties/${property.id}` };
  return { label: "Continue designing", href: `/properties/${property.id}` };
}

export function HomeDashboard({
  properties,
}: {
  properties: DashboardProperty[];
}) {
  const featured = properties[0];
  const featuredProgress = featured ? getProgress(featured) : 0;
  const featuredNext = featured ? nextStep(featured) : null;

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-10 text-paper shadow-2xl shadow-ink/10 md:px-12 md:py-14">
        <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full border border-brass/25" />
        <div className="pointer-events-none absolute -bottom-44 left-1/2 h-96 w-96 rounded-full bg-laterite/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">
            Your home intelligence
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(3.5rem,8vw,7rem)] font-semibold leading-[0.82] tracking-[-0.06em]">
            Build with more clarity.
          </h1>
          <p className="mt-7 max-w-2xl font-body text-base leading-relaxed text-paper/65 md:text-lg">
            Niwasthan connects your real home to design, materials, budget and
            execution—so you can see the important decisions before they become
            expensive ones.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="#your-homes"
              className="inline-flex items-center gap-2 rounded-full bg-brass px-5 py-3 font-body text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Continue your journey <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-3 font-body text-sm text-paper/80 transition-colors hover:border-brass/60 hover:text-paper"
            >
              See the plans
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laterite">
              The journey
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] md:text-5xl"
            >
              From real home to better decisions.
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft md:block">
            04 steps · one connected context
          </span>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-[1.5rem] border border-paper-raised bg-paper-raised md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.key}
                className="group bg-paper p-6 transition-colors hover:bg-paper-raised/70 md:min-h-60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-laterite">
                    {step.number}
                  </span>
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className="text-ink-soft transition-transform group-hover:scale-110 group-hover:text-laterite"
                  />
                </div>
                <h3 className="mt-12 font-display text-2xl font-semibold leading-[0.95] tracking-[-0.035em]">
                  {step.title}
                </h3>
                <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="your-homes" aria-labelledby="homes-heading">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laterite">
              Your projects
            </p>
            <h2
              id="homes-heading"
              className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] md:text-5xl"
            >
              The homes you are shaping.
            </h2>
          </div>
          <Link
            href="#add-home"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 font-body text-sm font-medium text-ink transition-colors hover:border-laterite hover:text-laterite"
          >
            Add another home <ArrowRight size={15} />
          </Link>
        </div>

        {featured ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <Link
              href={`/properties/${featured.id}`}
              className="group rounded-[1.5rem] border border-ink/10 bg-white p-7 transition-all hover:-translate-y-1 hover:border-brass/70 hover:shadow-xl hover:shadow-ink/10 md:p-9"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laterite">
                    Active home
                  </p>
                  <h3 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em]">
                    {featured.name}
                  </h3>
                  <p className="mt-2 font-body text-sm text-ink-soft">
                    {featured.city ??
                      featured.address ??
                      "Location to be confirmed"}
                  </p>
                </div>
                <ArrowRight className="text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-laterite" />
              </div>
              <div className="mt-10 grid gap-5 border-t border-paper-raised pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                    Progress
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {featuredProgress}%
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                    Rooms understood
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {featured.roomCount}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                    Target budget
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatBudget(featured.targetBudgetMinor)}
                  </p>
                </div>
              </div>
              <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-paper-raised">
                <div
                  className="h-full rounded-full bg-laterite transition-all duration-500 group-hover:bg-brass"
                  style={{ width: `${featuredProgress}%` }}
                />
              </div>
              <p className="mt-4 font-body text-sm font-medium text-laterite">
                {featuredNext?.label} <span aria-hidden="true">→</span>
              </p>
            </Link>
            <div className="rounded-[1.5rem] bg-paper-raised/55 p-7 md:p-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laterite">
                What comes next
              </p>
              <h3 className="mt-4 font-display text-3xl font-semibold leading-[0.95] tracking-[-0.04em]">
                Keep the real home as your source of truth.
              </h3>
              <ul className="mt-7 space-y-4">
                {[
                  "Upload the floor plan or photos",
                  "Review what is known and what is inferred",
                  "Explore directions before locking decisions",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 font-body text-sm leading-relaxed text-ink-soft"
                  >
                    <Check size={16} className="mt-0.5 shrink-0 text-moss" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={featuredNext?.href ?? "#"}
                className="mt-8 inline-flex items-center gap-2 font-body text-sm font-semibold text-laterite hover:underline"
              >
                Continue with {featured.name} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-ink/20 bg-white px-7 py-12 text-center">
            <p className="font-display text-2xl font-semibold">
              Your first home starts here.
            </p>
            <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-ink-soft">
              Add the property you want to understand and we will guide you from
              the real space to the next decision.
            </p>
          </div>
        )}

        {properties.length > 1 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {properties.slice(1).map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="flex items-center justify-between rounded-[1.25rem] border border-ink/10 bg-white px-6 py-5 transition-colors hover:border-brass"
              >
                <span>
                  <span className="block font-display text-2xl font-semibold">
                    {property.name}
                  </span>
                  <span className="mt-1 block font-body text-sm text-ink-soft">
                    {property.city ??
                      property.address ??
                      "Location to be confirmed"}
                  </span>
                </span>
                <ArrowRight size={17} className="text-ink-soft" />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section
        id="add-home"
        className="scroll-mt-8 border-t border-paper-raised pt-12"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laterite">
          Start a new project
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
          Add a home to understand.
        </h2>
        <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-soft">
          Your property profile is the foundation for everything that follows:
          rooms, design directions, materials, costs and execution.
        </p>
      </section>
    </div>
  );
}
