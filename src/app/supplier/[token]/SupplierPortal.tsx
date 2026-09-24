"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Context = {
  supplierName: string;
  propertyName: string;
  propertyAddress: string;
};

export function SupplierPortal({ token }: { token: string }) {
  const t = useTranslations("supplierPortal");
  const [context, setContext] = useState<Context | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<
    "loading" | "ready" | "submitted" | "error"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/supplier-portal/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error?.message ?? t("inviteUnavailableDefault"));
        setContext(body.context);
        setState("ready");
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : t("inviteUnavailableDefault"),
        );
      });
  }, [token, t]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rupees = Number(amount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setMessage(t("enterValidAmount"));
      return;
    }
    setMessage("");
    const response = await fetch(
      `/api/supplier-portal/${encodeURIComponent(token)}/quote`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          totalAmountMinor: Math.round(rupees * 100),
          notes: notes.trim() || undefined,
        }),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error?.message ?? t("couldNotSubmitQuote"));
      return;
    }
    setState("submitted");
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-laterite">
          {t("eyebrowSupplierPortal")}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          {t("heading")}
        </h1>
        <p className="mt-3 max-w-xl font-body text-base leading-7 text-ink-soft">
          {t("description")}
        </p>
        {state === "loading" ? (
          <section className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-7">
            {t("loadingInviteDetails")}
          </section>
        ) : null}
        {state === "error" ? (
          <section className="mt-10 rounded-[1.5rem] border border-laterite/30 bg-white p-7">
            <h2 className="font-display text-2xl font-semibold">
              {t("inviteUnavailable")}
            </h2>
            <p className="mt-3 font-body text-sm leading-6 text-ink-soft">
              {message}
            </p>
          </section>
        ) : null}
        {state === "submitted" ? (
          <section className="mt-10 rounded-[1.5rem] border border-sage/40 bg-white p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sage">
              {t("quoteReceivedBadge")}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              {t("thankYouQuoteRecorded")}
            </h2>
            <p className="mt-3 font-body text-sm leading-6 text-ink-soft">
              {t("homeownerWillSeeQuote")}
            </p>
          </section>
        ) : null}
        {state === "ready" && context ? (
          <section className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-7 shadow-[0_18px_50px_rgba(57,47,38,0.08)]">
            <div className="border-b border-paper-raised pb-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laterite">
                {t("invitedSupplierLabel")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                {context.supplierName}
              </h2>
              <p className="mt-1 font-body text-sm text-ink-soft">
                {t("forPropertyAddress", {
                  propertyName: context.propertyName,
                  propertyAddress: context.propertyAddress,
                })}
              </p>
            </div>
            <form onSubmit={submit} className="mt-6 space-y-5">
              <label className="block">
                <span className="font-body text-sm font-semibold">
                  {t("totalQuoteAmountLabel")}
                </span>
                <input
                  required
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={t("amountPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 font-body outline-none focus:border-laterite"
                />
              </label>
              <label className="block">
                <span className="font-body text-sm font-semibold">
                  {t("notesInclusionsLabel")}
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder={t("notesPlaceholder")}
                  className="mt-2 w-full resize-y rounded-xl border border-ink/15 bg-paper px-4 py-3 font-body outline-none focus:border-laterite"
                />
              </label>
              {message ? (
                <p className="font-body text-sm text-laterite">{message}</p>
              ) : null}
              <button className="rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.98]">
                {t("submitQuoteSecurely")}
              </button>
              <p className="font-body text-xs leading-5 text-ink-soft">
                {t("oneTimeInviteNote")}
              </p>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
