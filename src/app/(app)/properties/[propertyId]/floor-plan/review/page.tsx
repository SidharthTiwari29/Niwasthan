import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { roomService } from "@/server/services/roomService";
import { assetService } from "@/server/services/assetService";
import { floorPlanService } from "@/server/services/floorPlanService";
import { getLatestAnalysisForFloorPlan } from "@/server/services/floorPlanAnalysisService";
import { ReviewWorkspace } from "./ReviewWorkspace";

export default async function FloorPlanReviewPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const t = await getTranslations("floorPlanReview");

  const rooms = await roomService.list(propertyId, userId);

  // The most recent floor plan for this property is what gets
  // reviewed - matching the same "latest version" convention already
  // used for RoomUnderstanding.
  const floorPlans = await floorPlanService.list(propertyId, userId);
  const floorPlan = floorPlans[0] ?? null;
  if (!floorPlan) notFound();

  const { analysis, issues, effectiveConfidenceBpsById } =
    await getLatestAnalysisForFloorPlan(floorPlan.id, userId);

  const { downloadUrl } = await assetService.createDownloadUrl(
    floorPlan.assetId,
    userId,
  );

  return (
    <div>
      <Link
        href={`/properties/${propertyId}/floor-plan`}
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        {t("backToFloorPlan")}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        {t("heading")}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-ink-soft">
        {t("description")}
      </p>

      <ReviewWorkspace
        propertyId={propertyId}
        floorPlanImageUrl={downloadUrl}
        analysis={
          analysis
            ? {
                status: analysis.status,
                reason: analysis.reason,
                observations: analysis.observations.map(
                  (o: {
                    id: string;
                    roomLabel: string;
                    confidenceBps: number | null;
                    dimensions: unknown;
                    matchedRoomId: string | null;
                    matchedRoom: { name: string } | null;
                    rejected: boolean;
                  }) => ({
                    id: o.id,
                    roomLabel: o.roomLabel,
                    confidenceBps: o.confidenceBps,
                    effectiveConfidenceBps:
                      effectiveConfidenceBpsById[o.id] ?? null,
                    dimensions:
                      (o.dimensions as Record<string, unknown> | null) ?? null,
                    matchedRoomId: o.matchedRoomId,
                    matchedRoomName: o.matchedRoom?.name ?? null,
                    rejected: o.rejected,
                  }),
                ),
              }
            : null
        }
        issues={issues}
        rooms={rooms.map((r: { id: string; name: string }) => ({
          id: r.id,
          name: r.name,
        }))}
      />
    </div>
  );
}
