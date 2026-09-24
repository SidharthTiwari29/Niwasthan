import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { getCustomerProcurement } from "@/server/services/customerProcurementService";
import { QuoteComparison } from "./QuoteComparison";

export default async function PropertyProcurementPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const procurement = await getCustomerProcurement(propertyId, userId);
  if (!procurement) notFound();
  const t = await getTranslations("quoteComparison");
  const order = procurement.requests[0]?.orders[0];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="font-body text-sm text-ink-soft hover:text-ink"
        >
          {t("backToProperty", { name: procurement.name })}
        </Link>
        <Link
          href={`/properties/${propertyId}/progress`}
          className="font-body text-sm font-semibold text-laterite hover:underline"
        >
          {t("openBuildLifecycle")}
        </Link>
      </div>
      <section className="rounded-[1.75rem] bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass">
          {t("eyebrowProcurementIntelligence")}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
          {t("heading")}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-paper/65">
          {t("description")}
        </p>
      </section>
      {order ? (
        <section className="rounded-2xl border border-moss/30 bg-moss/10 px-5 py-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-moss-deep">
            {t("orderCreatedLabel")}
          </p>
          <p className="mt-2 font-body text-sm text-ink">
            {t("orderCreatedDescription", { status: order.status })}
          </p>
        </section>
      ) : null}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
              {t("liveSupplierResponses")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {t("quoteComparisonHeading")}
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
            {procurement.requests[0]?.status ?? t("noRequest")}
          </span>
        </div>
        <QuoteComparison requests={procurement.requests} />
      </section>
    </div>
  );
}
