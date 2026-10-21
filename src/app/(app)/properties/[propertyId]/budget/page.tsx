import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { propertyService } from "@/server/services/propertyService";
import { budgetService } from "@/server/services/budgetService";
import {
  projectOptimizationService,
  type RoomBudgetSummary,
  type TradeOffRecommendation,
} from "@/server/services/projectOptimizationService";
import { savingRepository } from "@/server/repositories/savingRepository";

type SavingRow = Awaited<
  ReturnType<typeof savingRepository.listForProperty>
>[number];

function formatRupees(minor: bigint | number): string {
  const rupees = Number(minor) / 100;
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

// README §11/§15: a consolidated Budget / BOQ workspace, rather than
// budget only being visible embedded inside a single design project's
// DesignWorkspace. This reads the same real, persisted BudgetPlan the
// per-project view already uses (budgetService.get), plus the real
// cross-room optimization reasoning (projectOptimizationService, §10)
// and the real Saving ledger (§9) - all property-scoped, so it is the
// one place to see the whole project's money, not one room at a time.
export default async function PropertyBudgetPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const property = await propertyService.get(propertyId, userId);

  const t = await getTranslations("propertyBudget");

  const [budget, optimization, savings] = await Promise.all([
    budgetService.get(propertyId, userId),
    projectOptimizationService.optimize(propertyId, userId),
    savingRepository.listForProperty(propertyId, userId),
  ]);

  const latestVersion = budget?.versions[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="font-body text-sm text-ink-soft hover:text-ink"
        >
          {t("backToProperty", { name: property.name })}
        </Link>
      </div>

      <section className="rounded-[1.75rem] bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
          {t("heading")}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-paper/65">
          {t("description")}
        </p>
      </section>

      {!latestVersion ? (
        <section className="rounded-[1.5rem] border border-ink/10 bg-white p-8 text-center">
          <p className="font-body text-sm text-ink-soft">{t("noBudgetYet")}</p>
        </section>
      ) : (
        <>
          <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
                  {t("planStatusLabel")}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {budget?.plan.status}
                </h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
                  {t("totalRangeLabel")}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold">
                  {formatRupees(latestVersion.totalLowMinor)} –{" "}
                  {formatRupees(latestVersion.totalHighMinor)}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {t("targetLabel")}:{" "}
                  {formatRupees(latestVersion.totalTargetMinor)}
                </p>
              </div>
            </div>
          </section>

          {optimization && optimization.rooms.length > 0 ? (
            <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold">
                {t("roomBreakdownHeading")}
              </h2>
              <ul className="mt-5 divide-y divide-paper-raised">
                {optimization.rooms.map((room: RoomBudgetSummary) => (
                  <li
                    key={room.roomId ?? "unassigned"}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <span className="font-body text-sm font-medium text-ink">
                      {room.roomId ?? t("unassignedRoom")}
                    </span>
                    <span className="flex gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                      <span>
                        {formatRupees(room.lowMinor)} –{" "}
                        {formatRupees(room.highMinor)}
                      </span>
                      {room.headroomMinor > 0n ? (
                        <span className="text-moss">
                          {t("roomHeadroom")}:{" "}
                          {formatRupees(room.headroomMinor)}
                        </span>
                      ) : null}
                      {room.stretchMinor > 0n ? (
                        <span className="text-laterite">
                          {t("roomStretch")}: {formatRupees(room.stretchMinor)}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-paper-raised pt-6">
                <h3 className="font-body text-sm font-semibold text-ink">
                  {t("optimizationHeading")}
                </h3>
                {optimization.recommendations.length === 0 ? (
                  <p className="mt-3 font-body text-sm text-ink-soft">
                    {t("noOptimization")}
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {optimization.recommendations.map(
                      (rec: TradeOffRecommendation, index: number) => (
                        <li
                          key={`${rec.fromRoomId}-${rec.toRoomId}-${index}`}
                          className="rounded-xl bg-paper/70 p-4"
                        >
                          <p className="font-body text-sm font-medium text-ink">
                            {t("shiftFrom")}{" "}
                            <span className="text-laterite">
                              {rec.fromRoomId ?? t("unassignedRoom")}
                            </span>{" "}
                            {t("shiftTo")}{" "}
                            <span className="text-laterite">
                              {rec.toRoomId ?? t("unassignedRoom")}
                            </span>
                            : {formatRupees(rec.shiftMinor)}
                          </p>
                          <p className="mt-1 font-body text-xs leading-relaxed text-ink-soft">
                            {rec.rationale}
                          </p>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
        <h2 className="font-display text-2xl font-semibold">
          {t("savingsHeading")}
        </h2>
        {savings.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ink-soft">
            {t("noSavings")}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-paper-raised">
            {savings.map((saving: SavingRow) => (
              <li
                key={saving.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-body text-sm font-medium text-ink">
                    {saving.reason}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                    {saving.status === "REALISED"
                      ? t("savingStatusRealised")
                      : t("savingStatusAccepted")}
                  </p>
                </div>
                <span className="font-display text-lg font-semibold text-moss">
                  {saving.savingMinor !== null
                    ? formatRupees(saving.savingMinor)
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
