import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { getDesignProject } from "@/server/services/designProjectService";
import { designDirectionService } from "@/server/services/designDirectionService";
import { designLayoutObjectService } from "@/server/services/designLayoutObjectService";
import { DesignWorkspace } from "./DesignWorkspace";

export default async function DesignProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { userId } = await requireAuth();
  const t = await getTranslations("designWorkspace");
  const project = await getDesignProject(projectId, userId);
  if (!project) notFound();

  const directions = await designDirectionService.listDirections(
    projectId,
    userId,
  );
  const layoutObjects = await designLayoutObjectService.list(projectId, userId);
  const latestUnderstanding = project.room?.roomUnderstandings[0] ?? null;
  const rawDimensions = latestUnderstanding?.dimensions;
  const dimensions =
    rawDimensions && typeof rawDimensions === "object"
      ? (rawDimensions as Record<string, unknown>)
      : null;
  const lengthFt =
    typeof dimensions?.lengthFt === "number" ? dimensions.lengthFt : null;
  const widthFt =
    typeof dimensions?.widthFt === "number" ? dimensions.widthFt : null;

  return (
    <div>
      <Link
        href={`/properties/${project.propertyId}`}
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        {t("backToHome")}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        {project.name}
      </h1>
      {project.room ? (
        <p className="mt-1 font-body text-sm text-ink-soft">
          {project.room.name}
        </p>
      ) : (
        <p className="mt-1 font-body text-sm text-ink-soft">
          {t("wholePropertyNote")}
        </p>
      )}

      <DesignWorkspace
        projectId={projectId}
        propertyId={project.propertyId}
        hasRoom={project.roomId !== null}
        initialDirections={directions}
        initialLayoutObjects={layoutObjects}
        roomEvidence={
          project.room
            ? {
                roomId: project.room.id,
                roomName: project.room.name,
                status: latestUnderstanding?.status ?? null,
                lengthFt,
                widthFt,
              }
            : null
        }
      />
    </div>
  );
}
