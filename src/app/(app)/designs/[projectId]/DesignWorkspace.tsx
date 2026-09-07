"use client";

import { useState } from "react";
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

      {error ? <p className="font-body text-sm text-alert">{error}</p> : null}
    </div>
  );
}
