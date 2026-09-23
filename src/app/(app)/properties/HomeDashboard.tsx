import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  Compass,
  FileUp,
  House,
  Sparkles,
  Upload,
  WalletCards,
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

function formatBudget(
  minor: number | null,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (!minor) return t("budgetNotSet");
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}
function getProgress(property: DashboardProperty) {
  if (property.designCount > 0) return 75;
  if (property.roomCount > 0) return 50;
  return 25;
}
function nextStep(
  property: DashboardProperty,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (property.roomCount === 0)
    return {
      label: t("nextStepUploadFloorPlan"),
      href: `/properties/${property.id}/floor-plan`,
    };
  if (property.designCount === 0)
    return {
      label: t("nextStepOpenHome"),
      href: `/properties/${property.id}`,
    };
  return {
    label: t("nextStepContinueDesigning"),
    href: `/properties/${property.id}`,
  };
}

export async function HomeDashboard({
  properties,
}: {
  properties: DashboardProperty[];
}) {
  const t = await getTranslations("homeDashboard");
  const steps = [
    {
      number: "01",
      title: t("step1Title"),
      description: t("step1Description"),
      icon: House,
    },
    {
      number: "02",
      title: t("step2Title"),
      description: t("step2Description"),
      icon: FileUp,
    },
    {
      number: "03",
      title: t("step3Title"),
      description: t("step3Description"),
      icon: Compass,
    },
    {
      number: "04",
      title: t("step4Title"),
      description: t("step4Description"),
      icon: Sparkles,
    },
  ] as const;

  const featured = properties[0];
  const progress = featured ? getProgress(featured) : 0;
  const action = featured ? nextStep(featured, t) : null;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-10 text-paper shadow-2xl shadow-ink/10 md:px-12 md:py-14">
        <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full border border-brass/25" />
        <div className="pointer-events-none absolute -bottom-44 left-1/2 h-96 w-96 rounded-full bg-laterite/15 blur-3xl" />
        <div className="relative max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">
            {t("eyebrowHomeIntelligence")}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(3.6rem,8vw,7.2rem)] font-semibold leading-[0.82] tracking-[-0.06em]">
            {t("heroTitle")}
          </h1>
          <p className="mt-7 max-w-2xl font-body text-base leading-relaxed text-paper/65 md:text-lg">
            {t("heroDescription")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={featured ? `/properties/${featured.id}` : "#your-homes"}
              className="inline-flex items-center gap-2 rounded-full bg-brass px-5 py-3 font-body text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {t("continueYourJourney")} <ArrowRight size={16} />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-3 font-body text-sm text-paper/80 transition-colors hover:border-brass/60 hover:text-paper"
            >
              {t("seeTheSystem")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section id="your-homes" aria-labelledby="homes-heading">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laterite">
              {t("yourProjectsEyebrow")}
            </p>
            <h2
              id="homes-heading"
              className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] md:text-5xl"
            >
              {t("homesHeading")}
            </h2>
          </div>
          <Link
            href="#add-home"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 font-body text-sm font-medium text-ink transition-colors hover:border-laterite hover:text-laterite"
          >
            {t("addAnotherHome")} <ArrowRight size={15} />
          </Link>
        </div>
        {featured ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <Link
              href={`/properties/${featured.id}`}
              className="group rounded-[1.5rem] border border-ink/10 bg-white p-7 transition-all hover:-translate-y-1 hover:border-brass/70 hover:shadow-xl hover:shadow-ink/10 md:p-9"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laterite">
                    {t("activeHomeLabel")}
                  </p>
                  <h3 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em]">
                    {featured.name}
                  </h3>
                  <p className="mt-2 font-body text-sm text-ink-soft">
                    {featured.city ??
                      featured.address ??
                      t("locationToBeConfirmed")}
                  </p>
                </div>
                <ArrowRight className="text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-laterite" />
              </div>
              <div className="mt-10 grid gap-5 border-t border-paper-raised pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                    {t("progressLabel")}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {progress}%
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                    {t("roomsUnderstoodLabel")}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {featured.roomCount}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                    {t("targetBudgetLabel")}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatBudget(featured.targetBudgetMinor, t)}
                  </p>
                </div>
              </div>
              <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-paper-raised">
                <div
                  className="h-full rounded-full bg-laterite transition-all duration-500 group-hover:bg-brass"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-4 font-body text-sm font-medium text-laterite">
                {action?.label} <span aria-hidden="true">→</span>
              </p>
            </Link>
            <div className="rounded-[1.5rem] bg-paper-raised/60 p-7 md:p-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laterite">
                {t("nextBestStepEyebrow")}
              </p>
              <h3 className="mt-4 font-display text-3xl font-semibold leading-[0.95] tracking-[-0.04em]">
                {t("keepRealHomeTitle")}
              </h3>
              <ul className="mt-7 space-y-4">
                {[
                  t("uploadFloorPlanOrPhotos"),
                  t("reviewKnownInferred"),
                  t("exploreDirectionsBeforeLocking"),
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
                href={action?.href ?? "#"}
                className="mt-8 inline-flex items-center gap-2 font-body text-sm font-semibold text-laterite hover:underline"
              >
                {t("continueWithName", { name: featured.name })}{" "}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-ink/20 bg-white px-7 py-12 text-center">
            <p className="font-display text-2xl font-semibold">
              {t("firstHomeStartsHere")}
            </p>
            <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-ink-soft">
              {t("firstHomeDescription")}
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
                      t("locationToBeConfirmed")}
                  </span>
                </span>
                <ArrowRight size={17} className="text-ink-soft" />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section id="how-it-works" aria-labelledby="how-heading">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laterite">
              {t("journeyEyebrow")}
            </p>
            <h2
              id="how-heading"
              className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] md:text-5xl"
            >
              {t("fromRealHomeHeading")}
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft md:block">
            {t("fourStepsLabel")}
          </span>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-[1.5rem] border border-paper-raised bg-paper-raised md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
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

      <section
        id="add-home"
        className="scroll-mt-8 border-t border-paper-raised pt-12"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.5rem] bg-[#e9e1d5] p-7 md:p-9">
            <Upload className="text-laterite" size={22} />
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-[-0.045em]">
              {t("bringHomeIntoRoomTitle")}
            </h2>
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-ink-soft">
              {t("bringHomeIntoRoomDescription")}
            </p>
            <Link
              href={featured ? `/properties/${featured.id}/floor-plan` : "#"}
              className="mt-7 inline-flex items-center gap-2 font-body text-sm font-semibold text-laterite"
            >
              {t("uploadFloorPlanCta")} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rounded-[1.5rem] bg-ink p-7 text-paper md:p-9">
            <WalletCards className="text-brass" size={22} />
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-[-0.045em]">
              {t("beautifulOptionTitle")}
            </h2>
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-paper/65">
              {t("beautifulOptionDescription")}
            </p>
            <Link
              href="/catalogue"
              className="mt-7 inline-flex items-center gap-2 font-body text-sm font-semibold text-brass"
            >
              {t("exploreCatalogueCta")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
