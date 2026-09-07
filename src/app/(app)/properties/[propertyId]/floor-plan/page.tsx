import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { propertyService } from "@/server/services/propertyService";
import { floorPlanService } from "@/server/services/floorPlanService";
import { FloorPlanUploadForm } from "./FloorPlanUploadForm";

export default async function FloorPlanPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const t = await getTranslations("floorPlan");

  const property = await propertyService.get(propertyId, userId);
  if (!property) notFound();

  const floorPlans = await floorPlanService.list(propertyId, userId);

  return (
    <div>
      <Link
        href={`/properties/${propertyId}`}
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        {t("backToHome")}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        {t("heading")}
      </h1>
      <p className="mt-1 font-body text-sm text-ink-soft">{t("description")}</p>

      {floorPlans.length > 0 ? (
        <ul className="mt-6 divide-y divide-paper-raised">
          {floorPlans.map(
            (fp: { id: string; version: number; createdAt: Date }) => (
              <li
                key={fp.id}
                className="flex items-center justify-between py-3"
              >
                <span className="font-body text-sm text-ink">
                  {t("versionLabel", { number: fp.version })}
                </span>
                <span className="font-mono text-xs text-ink-soft">
                  {new Date(fp.createdAt).toLocaleDateString()}
                </span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="mt-6 font-body text-sm text-ink-soft">
          {t("noFloorPlanYet")}
        </p>
      )}

      <div className="mt-8 border-t border-paper-raised pt-6">
        <FloorPlanUploadForm propertyId={propertyId} />
      </div>
    </div>
  );
}
