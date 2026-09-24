"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Snag = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string | Date;
  resolvedAt: string | Date | null;
};
type Execution = {
  id: string;
  status: string;
  snagNotes: string | null;
  snags: Snag[];
  handover: {
    id: string;
    status: string;
    notes: string | null;
    acceptedAt: string | Date | null;
  } | null;
};

export function ExecutionReview({
  propertyId,
  execution,
}: {
  propertyId: string;
  execution: Execution | undefined;
}) {
  const t = useTranslations("propertyProgress");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const snagStatusLabels: Record<string, string> = {
    OPEN: t("snagStatusOpen"),
    IN_REVIEW: t("snagStatusInReview"),
    RESOLVED: t("snagStatusResolved"),
    ACCEPTED: t("snagStatusAccepted"),
  };
  const executionStatusLabels: Record<string, string> = {
    SCHEDULED: t("executionStatusScheduled"),
    IN_PROGRESS: t("executionStatusInProgress"),
    COMPLETED: t("executionStatusCompleted"),
    SNAGGED: t("executionStatusSnagged"),
    RESOLVED: t("executionStatusResolved"),
  };
  const handoverStatusLabels: Record<string, string> = {
    READY_FOR_REVIEW: t("handoverStatusReadyForReview"),
    ACCEPTED: t("handoverStatusAccepted"),
    REOPENED: t("handoverStatusReopened"),
  };

  if (!execution)
    return (
      <section className="rounded-[1.5rem] border border-dashed border-ink/20 bg-white p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
          {t("executionReviewLabel")}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          {t("awaitingExecutionHeading")}
        </h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
          {t("awaitingExecutionDescription")}
        </p>
      </section>
    );
  const activeExecution = execution;
  async function createSnag() {
    if (!title.trim() || !description.trim()) {
      setMessage(t("addTitleDescription"));
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await fetch(
      `/api/executions/${activeExecution.id}/snags`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description, evidenceAssetIds: [] }),
      },
    );
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(body.error?.message ?? t("couldNotRecordSnag"));
      return;
    }
    setTitle("");
    setDescription("");
    setMessage(t("snagRecorded"));
    router.refresh();
  }
  async function updateSnag(snagId: string, status: string) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(
      `/api/executions/${activeExecution.id}/snags/${snagId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(body.error?.message ?? t("couldNotUpdateSnag"));
      return;
    }
    router.refresh();
  }
  async function reviewHandover(
    status: "READY_FOR_REVIEW" | "ACCEPTED" | "REOPENED",
  ) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/properties/${propertyId}/handover`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ executionId: activeExecution.id, status }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(body.error?.message ?? t("handoverNotReady"));
      return;
    }
    setMessage(
      status === "ACCEPTED" ? t("handoverAccepted") : t("handoverStateUpdated"),
    );
    router.refresh();
  }
  const unresolved = execution.snags.filter(
    (snag) => snag.status !== "RESOLVED" && snag.status !== "ACCEPTED",
  );
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
            {t("executionReviewLabel")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold">
            {t("qualityBeforeHandover")}
          </h2>
          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-ink-soft">
            {t("recordIssuesDescription")}
          </p>
        </div>
        <span className="rounded-full bg-paper-raised px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
          {executionStatusLabels[execution.status] ?? execution.status}
        </span>
      </div>
      {message ? (
        <p
          role="status"
          className="mt-5 rounded-xl border border-brass/30 bg-brass/10 px-4 py-3 font-body text-sm text-ink"
        >
          {message}
        </p>
      ) : null}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
              {t("snagsLabel")}
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
              {t("unresolvedCount", { count: unresolved.length })}
            </span>
          </div>
          {execution.snags.length ? (
            <div className="mt-3 space-y-3">
              {execution.snags.map((snag) => (
                <article key={snag.id} className="rounded-2xl bg-paper/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-body text-sm font-semibold">
                      {snag.title}
                    </h3>
                    <span className="rounded-full bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                      {snagStatusLabels[snag.status] ?? snag.status}
                    </span>
                  </div>
                  <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">
                    {snag.description}
                  </p>
                  {snag.status !== "ACCEPTED" ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {snag.status === "OPEN" ? (
                        <button
                          disabled={busy}
                          onClick={() => updateSnag(snag.id, "IN_REVIEW")}
                          className="font-body text-xs font-semibold text-laterite hover:underline"
                        >
                          {t("startReview")}
                        </button>
                      ) : null}
                      {snag.status === "IN_REVIEW" ? (
                        <button
                          disabled={busy}
                          onClick={() => updateSnag(snag.id, "RESOLVED")}
                          className="font-body text-xs font-semibold text-moss-deep hover:underline"
                        >
                          {t("markResolved")}
                        </button>
                      ) : null}
                      {snag.status === "RESOLVED" ? (
                        <button
                          disabled={busy}
                          onClick={() => updateSnag(snag.id, "ACCEPTED")}
                          className="font-body text-xs font-semibold text-ink hover:underline"
                        >
                          {t("acceptResolution")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-ink/15 px-4 py-5 font-body text-sm text-ink-soft">
              {t("noSnagsYet")}
            </p>
          )}
          <div className="mt-5 rounded-2xl border border-ink/10 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-laterite">
              {t("recordAnIssue")}
            </p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("shortIssueTitlePlaceholder")}
              className="mt-3 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 font-body text-sm outline-none focus:border-laterite"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("issueDescriptionPlaceholder")}
              rows={3}
              className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 font-body text-sm outline-none focus:border-laterite"
            />
            <button
              disabled={busy}
              onClick={createSnag}
              className="mt-3 rounded-full bg-ink px-4 py-2.5 font-body text-xs font-semibold text-paper disabled:opacity-50"
            >
              {t("recordSnag")}
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-[#e9e1d5] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-laterite">
            {t("handoverRecordLabel")}
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold">
            {execution.handover?.status
              ? (handoverStatusLabels[execution.handover.status] ??
                execution.handover.status)
              : t("notStarted")}
          </h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
            {unresolved.length ? t("resolveEverySnag") : t("allSnagsResolved")}
          </p>
          {execution.handover?.acceptedAt ? (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-moss-deep">
              {t("acceptedOn", {
                date: new Date(
                  execution.handover.acceptedAt,
                ).toLocaleDateString("en-IN"),
              })}
            </p>
          ) : (
            <div className="mt-5 space-y-2">
              <button
                disabled={busy}
                onClick={() => reviewHandover("READY_FOR_REVIEW")}
                className="w-full rounded-full border border-ink/20 px-4 py-2.5 font-body text-xs font-semibold text-ink disabled:opacity-50"
              >
                {t("markReadyForReview")}
              </button>
              <button
                disabled={busy || unresolved.length > 0}
                onClick={() => reviewHandover("ACCEPTED")}
                className="w-full rounded-full bg-ink px-4 py-2.5 font-body text-xs font-semibold text-paper disabled:opacity-40"
              >
                {t("acceptHandover")}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
