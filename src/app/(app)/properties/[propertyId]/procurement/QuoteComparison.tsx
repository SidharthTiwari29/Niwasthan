"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Quote = {
  id: string;
  supplierName: string;
  totalAmountMinor: number;
  currency: string;
  status: string;
  validUntil: string | Date | null;
  notes: string | null;
};
type Request = {
  id: string;
  status: string;
  quotes: Quote[];
  orders: {
    id: string;
    status: string;
    totalAmountMinor: number;
    currency: string;
    placedAt: string | Date;
  }[];
};

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function QuoteComparison({ requests }: { requests: Request[] }) {
  const t = useTranslations("quoteComparison");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [negotiation, setNegotiation] = useState<Record<string, string>>({});
  const request = requests[0];

  const quoteStatusLabels: Record<string, string> = {
    SUBMITTED: t("quoteStatusSubmitted"),
    ACCEPTED: t("quoteStatusAccepted"),
    REJECTED: t("quoteStatusRejected"),
    EXPIRED: t("quoteStatusExpired"),
  };

  function formatDate(value: string | Date | null) {
    return value ? new Date(value).toLocaleDateString("en-IN") : t("notStated");
  }

  async function acceptQuote(quoteId: string) {
    if (!request) return;
    setBusy(quoteId);
    setMessage(null);
    const response = await fetch(
      `/api/procurement/${request.id}/quotes/${quoteId}/accept`,
      { method: "POST" },
    );
    const body = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setMessage(body.error?.message ?? t("quoteNotAccepted"));
      return;
    }
    setMessage(t("quoteAcceptedOrderCreated"));
    router.refresh();
  }
  async function negotiate(quote: Quote) {
    if (!request) return;
    const rupees = Number(negotiation[quote.id]);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setMessage(t("enterPositiveAmount"));
      return;
    }
    setBusy(`negotiate-${quote.id}`);
    setMessage(null);
    const response = await fetch(
      `/api/procurement/${request.id}/quotes/${quote.id}/negotiate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposedAmountMinor: Math.round(rupees * 100) }),
      },
    );
    const body = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setMessage(body.error?.message ?? t("negotiationNotAvailable"));
      return;
    }
    setMessage(
      body.decision === "ACCEPTED"
        ? t("proposalAccepted")
        : body.decision === "COUNTERED"
          ? t("counterAmount", {
              amount: money(Number(body.counterAmountMinor), quote.currency),
            })
          : t("proposalNotAccepted"),
    );
    router.refresh();
  }

  if (!request)
    return (
      <div className="rounded-[1.5rem] border border-dashed border-ink/20 bg-white px-7 py-12 text-center">
        <p className="font-display text-2xl font-semibold">
          {t("noProcurementRequestYet")}
        </p>
        <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-ink-soft">
          {t("procurementBeginsDescription")}
        </p>
      </div>
    );
  if (!request.quotes.length)
    return (
      <div className="rounded-[1.5rem] border border-dashed border-ink/20 bg-white px-7 py-12 text-center">
        <p className="font-display text-2xl font-semibold">
          {t("waitingForQuotes")}
        </p>
        <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-ink-soft">
          {t("requestStatusNote", { status: request.status })}
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brass/40 bg-brass/10 px-5 py-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">
          {t("decisionGuardrailLabel")}
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">
          {t("decisionGuardrailDescription")}
        </p>
      </div>
      {message ? (
        <div
          role="status"
          className="rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 font-body text-sm text-ink"
        >
          {message}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {request.quotes.map((quote) => (
          <article
            key={quote.id}
            className={`rounded-[1.5rem] border bg-white p-6 ${quote.status === "ACCEPTED" ? "border-moss" : "border-ink/10"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">
                  {t("supplierLabel")}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold">
                  {quote.supplierName}
                </h3>
              </div>
              <span className="rounded-full bg-paper-raised px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
                {quoteStatusLabels[quote.status] ?? quote.status}
              </span>
            </div>
            <p className="mt-7 font-display text-4xl font-semibold">
              {money(quote.totalAmountMinor, quote.currency)}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-paper-raised py-4">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                  {t("validUntilLabel")}
                </dt>
                <dd className="mt-1 font-body text-sm">
                  {formatDate(quote.validUntil)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                  {t("priceBasisLabel")}
                </dt>
                <dd className="mt-1 font-body text-sm">{t("supplierQuote")}</dd>
              </div>
            </dl>
            {quote.notes ? (
              <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft">
                {quote.notes}
              </p>
            ) : (
              <p className="mt-4 font-body text-sm text-ink-soft">
                {t("noSupplierNote")}
              </p>
            )}
            {quote.status === "SUBMITTED" ? (
              <div className="mt-6 space-y-3">
                <button
                  disabled={busy !== null}
                  onClick={() => acceptQuote(quote.id)}
                  className="w-full rounded-full bg-ink px-4 py-3 font-body text-sm font-semibold text-paper disabled:opacity-50"
                >
                  {busy === quote.id
                    ? t("acceptingEllipsis")
                    : t("acceptQuoteCreateOrder")}
                </button>
                <div className="flex gap-2">
                  <input
                    value={negotiation[quote.id] ?? ""}
                    onChange={(event) =>
                      setNegotiation((current) => ({
                        ...current,
                        [quote.id]: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder={t("proposeAmountPlaceholder")}
                    className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2 font-body text-sm outline-none focus:border-laterite"
                  />
                  <button
                    disabled={busy !== null}
                    onClick={() => negotiate(quote)}
                    className="rounded-full border border-ink/20 px-4 py-2 font-body text-xs font-semibold text-ink disabled:opacity-50"
                  >
                    {busy === `negotiate-${quote.id}` ? "…" : t("negotiate")}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
