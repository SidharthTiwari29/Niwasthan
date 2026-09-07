"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Observation = {
  id: string;
  roomLabel: string;
  confidenceBps: number | null;
  effectiveConfidenceBps: number | null;
  dimensions: Record<string, unknown> | null;
  matchedRoomId: string | null;
  matchedRoomName: string | null;
  rejected: boolean;
};

type Issue = {
  observationId: string | null;
  severity: "error" | "warning";
  code: string;
  message: string;
};

type RoomOption = { id: string; name: string };

export function ReviewWorkspace({
  propertyId,
  floorPlanImageUrl,
  analysis,
  issues,
  rooms,
}: {
  propertyId: string;
  floorPlanImageUrl: string;
  analysis: {
    status: string;
    reason: string | null;
    observations: Observation[];
  } | null;
  issues: Issue[];
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const t = useTranslations("floorPlanReview");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMatch(observationId: string, roomId: string) {
    if (!roomId) return;
    setError(null);
    setBusyId(observationId);
    try {
      const response = await fetch(
        `/api/floor-plan-observations/${observationId}/match`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("errorMatch"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorMatch"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(observationId: string) {
    setError(null);
    setBusyId(observationId);
    try {
      const response = await fetch(
        `/api/floor-plan-observations/${observationId}/reject`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("errorReject"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorReject"));
    } finally {
      setBusyId(null);
    }
  }

  if (!analysis) {
    return (
      <p className="mt-8 font-body text-sm text-ink-soft">
        {t("noAnalysisYet")}
      </p>
    );
  }

  if (analysis.status === "NOT_AVAILABLE") {
    return (
      <div className="mt-8 max-w-xl rounded-sm border border-paper-raised bg-paper-raised/40 p-4">
        <p className="font-body text-sm text-ink">{analysis.reason}</p>
        <p className="mt-2 font-body text-xs text-ink-soft">
          {t("manualFallback")}
        </p>
      </div>
    );
  }

  const pending = analysis.observations.filter(
    (o) => !o.matchedRoomId && !o.rejected,
  );
  const decided = analysis.observations.filter(
    (o) => o.matchedRoomId || o.rejected,
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="lg:sticky lg:top-8 lg:h-fit">
        {/* eslint-disable-next-line @next/next/no-img-element -- this
            URL is a real, signed download URL from STORAGE_ENDPOINT, a
            storage provider domain that varies by deployment and isn't
            knowable ahead of time for next/image's required remote-pattern
            allowlist. Using next/image here would risk a real runtime
            failure to load the floor plan image at all. */}
        <img
          src={floorPlanImageUrl}
          alt={t("imageAlt")}
          className="w-full rounded-sm border border-paper-raised"
        />
      </div>

      <div>
        <p className="font-body text-sm font-semibold text-ink">
          {t("roomsNeedReview", { count: pending.length })}
        </p>

        <ul className="mt-4 space-y-3">
          {pending.map((obs) => {
            const relatedIssues = issues.filter(
              (i) => i.observationId === obs.id,
            );
            return (
              <li
                key={obs.id}
                className="rounded-sm border border-paper-raised p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-body text-sm font-medium text-ink">
                    {obs.roomLabel}
                  </p>
                  {obs.effectiveConfidenceBps !== null ? (
                    <span
                      className={`font-mono text-xs ${
                        relatedIssues.some((i) => i.severity === "error")
                          ? "text-alert"
                          : "text-ink-soft"
                      }`}
                    >
                      {t("confidenceLabel", {
                        percent: Math.round(obs.effectiveConfidenceBps / 100),
                      })}
                      {obs.confidenceBps !== null &&
                      obs.effectiveConfidenceBps < obs.confidenceBps
                        ? ` ${t("confidenceDownFrom", { percent: Math.round(obs.confidenceBps / 100) })}`
                        : ""}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-xs text-ink-soft">
                  {String(obs.dimensions?.lengthFt ?? "?")}ft ×{" "}
                  {String(obs.dimensions?.widthFt ?? "?")}ft
                </p>
                {relatedIssues.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {relatedIssues.map((issue, i) => (
                      <li
                        key={i}
                        className={`font-body text-xs ${
                          issue.severity === "error"
                            ? "text-alert"
                            : "text-ink-soft"
                        }`}
                      >
                        {issue.severity === "error" ? "⚠ " : "· "}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <select
                    disabled={busyId === obs.id}
                    onChange={(e) => handleMatch(obs.id, e.target.value)}
                    defaultValue=""
                    className="flex-1 rounded-sm border border-ink/15 bg-white px-2 py-1.5 font-body text-sm"
                  >
                    <option value="" disabled>
                      {t("whichRoom")}
                    </option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleReject(obs.id)}
                    disabled={busyId === obs.id}
                    className="font-body text-xs text-alert hover:underline"
                  >
                    {t("notARealRoom")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {decided.length > 0 ? (
          <div className="mt-8 border-t border-paper-raised pt-4">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {t("alreadyReviewed")}
            </p>
            <ul className="mt-3 space-y-2">
              {decided.map((obs) => (
                <li
                  key={obs.id}
                  className="flex items-center justify-between font-body text-sm text-ink-soft"
                >
                  <span>{obs.roomLabel}</span>
                  <span className="font-mono text-xs">
                    {obs.rejected
                      ? t("rejected")
                      : t("matchedTo", { name: obs.matchedRoomName ?? "" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 font-body text-sm text-alert">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
