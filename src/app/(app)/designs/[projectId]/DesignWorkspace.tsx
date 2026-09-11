"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Direction = {
  id: string;
  name: string;
  status: "ACTIVE" | "ALTERNATIVE" | "REJECTED";
};

type Selection = {
  itemId: string;
  itemName: string;
  brand: string | null;
  unitPriceMinor: string;
  quantity: number;
  lineTotalMinor: string;
};

type Recommendation = {
  id: string;
  status: string;
  selections: Selection[];
  totalMinor: string;
};

type RenderJobAsset = { id: string; type: string; contentType: string };
type RenderJobState = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  errorMessage: string | null;
  assets: RenderJobAsset[];
  downloadUrl?: string;
};

function formatRupees(minor: string | number): string {
  return `₹${(Number(minor) / 100).toLocaleString("en-IN")}`;
}

export function DesignWorkspace({
  projectId,
  hasRoom,
  initialDirections,
}: {
  projectId: string;
  hasRoom: boolean;
  initialDirections: Direction[];
}) {
  const router = useRouter();
  const t = useTranslations("designWorkspace");
  const tStatus = useTranslations("directionStatus");
  const [directions, setDirections] = useState(initialDirections);
  const [newDirectionName, setNewDirectionName] = useState("");
  const [targetBudget, setTargetBudget] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [committedBoq, setCommittedBoq] = useState<{
    id: string;
    totalMinor: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [renderJob, setRenderJob] = useState<RenderJobState | null>(null);

  const statusLabels: Record<string, string> = {
    ACTIVE: tStatus("active"),
    ALTERNATIVE: tStatus("alternative"),
    REJECTED: tStatus("rejected"),
  };

  async function createDirection() {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/design-projects/${projectId}/directions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newDirectionName }),
        },
      );
      if (!response.ok) throw new Error(t("errorCreateDirection"));
      const { direction } = await response.json();
      setDirections((prev) => [...prev, direction]);
      setNewDirectionName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function activateDirection(directionId: string) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/design-projects/${projectId}/directions/${directionId}/activate`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(t("errorActivateDirection"));
      setDirections((prev) =>
        prev.map((d) => ({
          ...d,
          status:
            d.id === directionId
              ? "ACTIVE"
              : d.status === "ACTIVE"
                ? "ALTERNATIVE"
                : d.status,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function generateBoq() {
    setError(null);
    setBusy(true);
    try {
      const budgetRupees = Number(targetBudget);
      const response = await fetch(
        `/api/design-projects/${projectId}/generate-boq`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetBudgetMinor: Math.round(budgetRupees * 100),
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("errorGenerateBoq"));
      }
      const { recommendation: rec } = await response.json();
      setRecommendation(rec);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function commitBoq() {
    if (!recommendation) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/catalogue/recommend/${recommendation.id}/commit`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(t("errorCommitBoq"));
      const { boq } = await response.json();
      setCommittedBoq(boq);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function requestRender(type: "THREE_D_SCENE" | "WALKTHROUGH") {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/design-projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          // A real, stable key per project+type so a double-click or a
          // retried request reuses the same real job rather than
          // spending a second real credit reservation for one logical
          // request - createAndEnqueueJob's own idempotency guarantee,
          // just given a real key to key off here.
          idempotencyKey: `${type}:${projectId}`,
          payload: { projectId },
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Couldn't start this render.");
      }
      const { job } = await response.json();
      setRenderJob({
        id: job.id,
        status: job.status,
        errorMessage: job.errorMessage,
        assets: job.assets ?? [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't start this render.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Real polling, not a fabricated "processing" spinner with no real
  // status behind it: a genuine render is asynchronous (the real
  // provider, once configured, can take anywhere from seconds to
  // minutes), so this checks the actual job state every few seconds
  // until it reaches a real terminal status, then stops - never keeps
  // polling a job that has genuinely already finished.
  useEffect(() => {
    if (
      !renderJob ||
      renderJob.status === "SUCCEEDED" ||
      renderJob.status === "FAILED"
    ) {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/design-projects/${projectId}/jobs/${renderJob.id}`,
        );
        if (!response.ok) return;
        const { job } = await response.json();
        setRenderJob((prev) =>
          prev
            ? {
                ...prev,
                status: job.status,
                errorMessage: job.errorMessage,
                assets: job.assets ?? [],
              }
            : prev,
        );
      } catch {
        // A real, transient network failure while polling - leave the
        // job exactly as it is and let the next tick retry, rather than
        // fabricating a failure the job itself never reported.
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [renderJob, projectId]);

  // Once a real asset is attached to a completed render job, fetch its
  // real, signed download URL exactly once - not on every poll tick,
  // since the asset itself doesn't change once the job has finished.
  useEffect(() => {
    if (
      renderJob?.status !== "SUCCEEDED" ||
      renderJob.assets.length === 0 ||
      renderJob.downloadUrl
    ) {
      return;
    }
    const assetId = renderJob.assets[0]!.id;
    fetch(`/api/assets/${assetId}/download-url`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.downloadUrl) {
          setRenderJob((prev) =>
            prev ? { ...prev, downloadUrl: data.downloadUrl } : prev,
          );
        }
      })
      .catch(() => {
        // Real, transient failure fetching the download URL - the asset
        // itself is still real and succeeded; this just means the link
        // isn't ready yet and a page refresh will pick it up.
      });
  }, [renderJob, projectId]);

  return (
    <div className="mt-10 space-y-10">
      {/* Directions */}
      <section>
        <h2 className="font-display text-lg font-semibold">
          {t("directionsHeading")}
        </h2>
        {directions.length === 0 ? (
          <p className="mt-2 font-body text-sm text-ink-soft">
            {t("noDirectionsYet")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {directions.map((direction) => (
              <li
                key={direction.id}
                className="flex items-center justify-between rounded-sm border border-paper-raised px-4 py-2.5"
              >
                <span className="font-body text-sm text-ink">
                  {direction.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-soft">
                    {statusLabels[direction.status] ?? direction.status}
                  </span>
                  {direction.status !== "ACTIVE" &&
                  direction.status !== "REJECTED" ? (
                    <button
                      onClick={() => activateDirection(direction.id)}
                      disabled={busy}
                      className="font-body text-xs font-medium text-laterite hover:underline disabled:opacity-50"
                    >
                      {t("makeActive")}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-3">
          <input
            value={newDirectionName}
            onChange={(e) => setNewDirectionName(e.target.value)}
            placeholder={t("directionNamePlaceholder")}
            className="rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
          />
          <button
            onClick={createDirection}
            disabled={busy || !newDirectionName.trim()}
            className="rounded-sm bg-indigo px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-indigo-soft disabled:opacity-50"
          >
            {t("addDirection")}
          </button>
        </div>
      </section>

      {/* BOQ generation */}
      {hasRoom ? (
        <section className="border-t border-paper-raised pt-8">
          <h2 className="font-display text-lg font-semibold">
            {t("generateBoqHeading")}
          </h2>
          <p className="mt-2 font-body text-sm text-ink-soft">
            {t("generateBoqDescription")}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-body text-sm text-ink-soft">₹</span>
            <input
              value={targetBudget}
              onChange={(e) => setTargetBudget(e.target.value)}
              type="number"
              placeholder={t("budgetPlaceholder")}
              className="rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
            />
            <button
              onClick={generateBoq}
              disabled={busy || !targetBudget}
              className="rounded-sm bg-laterite px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-laterite-deep disabled:opacity-50"
            >
              {t("generate")}
            </button>
          </div>
        </section>
      ) : null}

      {/* Recommendation preview + commit */}
      {recommendation && !committedBoq ? (
        <section className="border-t border-paper-raised pt-8">
          <h2 className="font-display text-lg font-semibold">
            {t("recommendationHeading")}
          </h2>
          <ul className="mt-4 divide-y divide-paper-raised">
            {recommendation.selections.map((selection) => (
              <li
                key={selection.itemId}
                className="flex items-center justify-between py-2"
              >
                <span className="font-body text-sm text-ink">
                  {selection.itemName}{" "}
                  {selection.brand ? (
                    <span className="text-ink-soft">· {selection.brand}</span>
                  ) : null}
                </span>
                <span className="font-body text-sm font-medium text-ink">
                  {formatRupees(selection.lineTotalMinor)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-paper-raised pt-4">
            <span className="font-body text-sm font-semibold text-ink">
              {t("total")}
            </span>
            <span className="font-display text-lg font-semibold text-ink">
              {formatRupees(recommendation.totalMinor)}
            </span>
          </div>
          <button
            onClick={commitBoq}
            disabled={busy}
            className="mt-4 rounded-sm bg-moss px-5 py-2.5 font-body text-sm font-medium text-paper transition-colors hover:bg-moss-deep disabled:opacity-50"
          >
            {t("commitBoq")}
          </button>
        </section>
      ) : null}

      {committedBoq ? (
        <section className="border-t border-paper-raised pt-8">
          <h2 className="font-display text-lg font-semibold">
            {t("committedBoqHeading")}
          </h2>
          <p className="mt-2 font-body text-sm text-ink-soft">
            {t("committedBoqDescription")}
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-ink">
            {formatRupees(committedBoq.totalMinor)}
          </p>
        </section>
      ) : null}

      {hasRoom ? (
        <section className="border-t border-paper-raised pt-8">
          <h2 className="font-display text-lg font-semibold">
            See your future room
          </h2>
          <p className="mt-2 font-body text-sm text-ink-soft">
            A real 3D scene or a full walkthrough, generated from this
            room&apos;s actual spatial data and your active design direction -
            not a stock rendering.
          </p>
          {!renderJob ? (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => requestRender("THREE_D_SCENE")}
                disabled={busy}
                className="rounded-sm bg-indigo px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-indigo-soft disabled:opacity-50"
              >
                Generate 3D scene
              </button>
              <button
                onClick={() => requestRender("WALKTHROUGH")}
                disabled={busy}
                className="rounded-sm bg-laterite px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-laterite-deep disabled:opacity-50"
              >
                Generate walkthrough
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-sm border border-paper-raised p-4">
              {renderJob.status === "QUEUED" ||
              renderJob.status === "RUNNING" ? (
                <p className="flex items-center gap-2 font-body text-sm text-ink-soft">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-laterite" />
                  Rendering your room — this can take a few minutes. Feel free
                  to leave this page; we&apos;ll keep working on it.
                </p>
              ) : renderJob.status === "FAILED" ? (
                <div>
                  <p className="font-body text-sm text-alert">
                    This render didn&apos;t complete.
                    {renderJob.errorMessage ? ` ${renderJob.errorMessage}` : ""}
                  </p>
                  <button
                    onClick={() => setRenderJob(null)}
                    className="mt-2 font-body text-xs text-laterite hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : renderJob.downloadUrl ? (
                <div>
                  <p className="font-body text-sm font-medium text-moss-deep">
                    Your render is ready.
                  </p>
                  <a
                    href={renderJob.downloadUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-block font-body text-sm text-laterite hover:underline"
                  >
                    View the real result →
                  </a>
                </div>
              ) : (
                <p className="font-body text-sm text-ink-soft">
                  Render complete — fetching the real, secure link to view it…
                </p>
              )}
            </div>
          )}
        </section>
      ) : null}

      {error ? <p className="font-body text-sm text-alert">{error}</p> : null}
    </div>
  );
}
