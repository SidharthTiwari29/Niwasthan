import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { getPropertyLifecycle } from "@/server/services/propertyLifecycleService";
import { ExecutionReview } from "./ExecutionReview";

// Real, stable internal identifiers - never translated, never shown to
// the customer directly. Kept separate from the translated display
// labels below so stageState's own comparisons never depend on which
// language is active.
const STAGE_IDS = [
  "designLock",
  "boqQuote",
  "purchase",
  "delivery",
  "installation",
  "qualitySnags",
  "handover",
] as const;

function stageState(
  stage: (typeof STAGE_IDS)[number],
  requests: NonNullable<
    Awaited<ReturnType<typeof getPropertyLifecycle>>
  >["requests"],
) {
  const request = requests[0];
  const order = request?.orders[0];
  const execution = order?.executions[0];
  if (stage === "boqQuote")
    return request
      ? request.quoteCount > 0
        ? "active"
        : "started"
      : "not-started";
  if (stage === "purchase")
    return order
      ? "complete"
      : request?.status === "ORDERED"
        ? "active"
        : "not-started";
  if (stage === "delivery")
    return order?.status === "DELIVERED"
      ? "complete"
      : order
        ? "active"
        : "not-started";
  if (stage === "installation")
    return execution?.status === "COMPLETED" || execution?.status === "RESOLVED"
      ? "complete"
      : execution
        ? "active"
        : "not-started";
  if (stage === "qualitySnags")
    return execution?.status === "SNAGGED"
      ? "attention"
      : execution?.status === "RESOLVED"
        ? "complete"
        : "not-started";
  if (stage === "handover")
    return execution?.status === "RESOLVED" ? "ready" : "not-started";
  return "not-started";
}

export default async function PropertyProgressPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const lifecycle = await getPropertyLifecycle(propertyId, userId);
  if (!lifecycle) notFound();
  const t = await getTranslations("propertyProgress");

  const request = lifecycle.requests[0];
  const order = request?.orders[0];
  const execution = order?.executions[0];
  const statusCopy: Record<string, string> = {
    complete: t("statusComplete"),
    active: t("statusInProgress"),
    started: t("statusStarted"),
    attention: t("statusAttention"),
    ready: t("statusReady"),
    "not-started": t("statusNotStarted"),
  };
  const stageLabels: Record<(typeof STAGE_IDS)[number], string> = {
    designLock: t("stageDesignLock"),
    boqQuote: t("stageBoqQuote"),
    purchase: t("stagePurchase"),
    delivery: t("stageDelivery"),
    installation: t("stageInstallation"),
    qualitySnags: t("stageQualitySnags"),
    handover: t("stageHandover"),
  };
  const executionStatusLabels: Record<string, string> = {
    SCHEDULED: t("executionStatusScheduled"),
    IN_PROGRESS: t("executionStatusInProgress"),
    COMPLETED: t("executionStatusCompleted"),
    SNAGGED: t("executionStatusSnagged"),
    RESOLVED: t("executionStatusResolved"),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="font-body text-sm text-ink-soft hover:text-ink"
        >
          {t("backToProperty", { name: lifecycle.name })}
        </Link>
        <Link
          href={`/properties/${propertyId}/memory`}
          className="font-body text-sm font-semibold text-laterite hover:underline"
        >
          {t("openHomeMemory")}
        </Link>
      </div>
      <section className="rounded-[1.75rem] bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass">
          {t("eyebrowBuildHandover")}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
          {t("heading")}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-paper/65">
          {t("description")}
        </p>
      </section>
      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
              {t("projectLifecycleLabel")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {t("fromLockToHandover")}
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
            {t("procurementRecordCount", { count: lifecycle.requests.length })}
          </span>
        </div>
        <ol className="mt-7 grid gap-3 md:grid-cols-7">
          {STAGE_IDS.map((stage, index) => {
            const state = stageState(stage, lifecycle.requests);
            return (
              <li key={stage} className="rounded-2xl bg-paper/70 p-4">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full font-mono text-xs ${state === "complete" ? "bg-moss text-paper" : state === "attention" ? "bg-alert text-paper" : state === "active" || state === "ready" ? "bg-brass text-ink" : "bg-paper-raised text-ink-soft"}`}
                >
                  {index + 1}
                </div>
                <p className="mt-4 font-body text-sm font-semibold text-ink">
                  {stageLabels[stage]}
                </p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                  {statusCopy[state]}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
            {t("quoteEvidenceLabel")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {request?.quoteCount
              ? t("quotesReceived", { count: request.quoteCount })
              : t("noQuoteReceivedYet")}
          </h2>
          {request?.quotes.length ? (
            <ul className="mt-5 divide-y divide-paper-raised">
              {request.quotes.slice(0, 4).map((quote) => (
                <li
                  key={quote.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span>
                    <span className="block font-body text-sm font-medium">
                      {quote.supplierName}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                      {quote.status}
                    </span>
                  </span>
                  <span className="font-display text-lg font-semibold">
                    ₹
                    {Math.round(quote.totalAmountMinor / 100).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
              {t("procurementAvailableNote")}
            </p>
          )}
        </section>
        <section className="rounded-[1.5rem] bg-[#e9e1d5] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
            {t("executionTruthLabel")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {execution
              ? (executionStatusLabels[execution.status] ?? execution.status)
              : t("awaitingExecutionRecord")}
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
            {execution?.snagNotes
              ? t("latestIssue", { notes: execution.snagNotes })
              : t("executionWillAppear")}
          </p>
          {execution?.scheduledDate ? (
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              {t("scheduledDate", {
                date: new Date(execution.scheduledDate).toLocaleDateString(
                  "en-IN",
                ),
              })}
            </p>
          ) : null}
        </section>
      </div>
      <ExecutionReview propertyId={propertyId} execution={execution} />
    </div>
  );
}
