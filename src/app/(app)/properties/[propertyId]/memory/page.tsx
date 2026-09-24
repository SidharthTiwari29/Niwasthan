import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { getPropertyMemory } from "@/server/services/propertyMemoryService";

function fieldKeys(t: Awaited<ReturnType<typeof getTranslations>>) {
  return [
    ["household", t("fieldHousehold")],
    ["lifestyle", t("fieldLifestyle")],
    ["designPersonality", t("fieldDesignPersonality")],
    ["storageNeeds", t("fieldStorageNeeds")],
    ["functionalNeeds", t("fieldFunctionalNeeds")],
    ["futureNeeds", t("fieldFutureNeeds")],
    ["smartHomePreferences", t("fieldSmartHomePreferences")],
  ] as const;
}

function readable(
  value: unknown,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (!value || typeof value !== "object") return t("notRecorded");
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return t("notRecorded");
  return entries
    .map(
      ([key, item]) =>
        `${key.replaceAll(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}: ${Array.isArray(item) ? item.join(", ") : String(item)}`,
    )
    .join(" · ");
}

export default async function PropertyMemoryPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const property = await getPropertyMemory(propertyId, userId);
  if (!property) notFound();
  const t = await getTranslations("propertyMemory");
  const memory = property.homeDnaVersions[0];
  const fields = fieldKeys(t);

  return (
    <div className="space-y-8">
      <Link
        href={`/properties/${propertyId}`}
        className="font-body text-sm text-ink-soft hover:text-ink"
      >
        {t("backToProperty", { name: property.name })}
      </Link>
      <section className="rounded-[1.75rem] bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass">
          {t("eyebrowDna")}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
          {t("heading")}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-paper/65">
          {t("description")}
        </p>
      </section>
      {memory ? (
        <>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-moss/30 bg-moss/10 px-5 py-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-moss-deep">
                {t("recordedMemoryLabel")}
              </p>
              <p className="mt-2 font-body text-sm text-ink">
                {t("versionLanguage", {
                  version: memory.version,
                  language: memory.language,
                })}
              </p>
            </div>
            <span className="rounded-full bg-moss px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-paper">
              {t("userStatedBadge")}
            </span>
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => (
              <article
                key={key}
                className="rounded-[1.25rem] border border-ink/10 bg-white p-6"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">
                  {label}
                </p>
                <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft">
                  {readable(memory[key], t)}
                </p>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-ink/20 bg-white px-7 py-12 text-center">
          <p className="font-display text-2xl font-semibold">
            {t("emptyHeading")}
          </p>
          <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-ink-soft">
            {t("emptyDescription")}
          </p>
        </section>
      )}
    </div>
  );
}
