import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { propertyService } from "@/server/services/propertyService";
import { roomService } from "@/server/services/roomService";
import { listDesignProjectsForProperty } from "@/server/services/designProjectService";
import { CreateRoomForm } from "./CreateRoomForm";
import { CreateDesignProjectForm } from "./CreateDesignProjectForm";

type RoomSummary = {
  id: string;
  name: string;
  type: string;
  areaSqFt: { toString(): string } | null;
};

type DesignProjectSummary = {
  id: string;
  name: string;
  status: string;
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const property = await propertyService.get(propertyId, userId);
  const t = await getTranslations("property");
  const tRoomType = await getTranslations("roomType");
  const tOnboarding = await getTranslations("onboarding");

  const PROPERTY_TYPE_LABELS: Record<string, string> = {
    ONE_BHK: tOnboarding("propertyTypeOneBhk"),
    TWO_BHK: tOnboarding("propertyTypeTwoBhk"),
    THREE_BHK: tOnboarding("propertyTypeThreeBhk"),
    FOUR_BHK: tOnboarding("propertyTypeFourBhk"),
    VILLA: tOnboarding("propertyTypeVilla"),
    OTHER: tOnboarding("propertyTypeOther"),
  };
  const ROOM_TYPE_LABELS: Record<string, string> = {
    LIVING_ROOM: tRoomType("livingRoom"),
    BEDROOM: tRoomType("bedroom"),
    KITCHEN: tRoomType("kitchen"),
    BATHROOM: tRoomType("bathroom"),
    DINING_ROOM: tRoomType("diningRoom"),
    BALCONY: tRoomType("balcony"),
    STUDY: tRoomType("study"),
    OTHER: tRoomType("other"),
  };

  // propertyService.get() already converts targetBudgetMinor to a plain
  // number (the real fix lives there now, applied once for every real
  // caller) - this is just the normal display-time conversion from
  // minor units to rupees, safe regardless.
  const targetBudgetRupees =
    property.targetBudgetMinor !== null &&
    property.targetBudgetMinor !== undefined
      ? Number(property.targetBudgetMinor) / 100
      : null;
  const rooms = await roomService.list(propertyId, userId);
  // Same real serialization risk as targetBudgetMinor above, for the
  // same reason: Prisma's Decimal type cannot safely cross into a
  // Client Component prop (CreateDesignProjectForm, below) through
  // Next.js's server/client boundary. Converting to a plain string
  // immediately removes the risk before it reaches that boundary.
  const roomsForClient = rooms.map(
    (room: {
      id: string;
      name: string;
      type: string;
      areaSqFt: { toString(): string } | null;
    }) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      areaSqFt: room.areaSqFt ? room.areaSqFt.toString() : null,
    }),
  );
  const designProjects = await listDesignProjectsForProperty(
    propertyId,
    userId,
  );

  return (
    <div>
      <Link
        href="/properties"
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        {t("backToHomes")}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        {property.name}
      </h1>
      <p className="mt-1 font-mono text-xs text-ink-soft">
        {t("propertyIdLabel", { id: property.id })}
      </p>
      {property.address ? (
        <p className="mt-1 font-body text-sm text-ink-soft">
          {property.address}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm text-ink-soft">
        {property.city ? <span>{property.city}</span> : null}
        {property.propertyType ? (
          <span>
            {PROPERTY_TYPE_LABELS[property.propertyType] ??
              property.propertyType}
          </span>
        ) : null}
        {targetBudgetRupees !== null ? (
          <span>
            {t("targetBudgetLabel", {
              amount: `₹${targetBudgetRupees.toLocaleString("en-IN")}`,
            })}
          </span>
        ) : null}
      </div>
      <Link
        href={`/properties/${propertyId}/floor-plan`}
        className="mt-3 inline-block font-body text-sm font-medium text-laterite hover:underline"
      >
        {t("uploadFloorPlan")}
      </Link>
      <Link
        href={`/properties/${propertyId}/floor-plan/review`}
        className="mt-1 block font-body text-sm font-medium text-laterite hover:underline"
      >
        {t("reviewDetectedRooms")}
      </Link>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">
          {t("roomsHeading")}
        </h2>
        {rooms.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ink-soft">
            {t("noRoomsYet")}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-paper-raised">
            {rooms.map((room: RoomSummary) => (
              <li
                key={room.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-body text-sm font-medium text-ink">
                    {room.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-ink-soft">
                    {ROOM_TYPE_LABELS[room.type] ?? room.type}
                    {room.areaSqFt
                      ? ` · ${room.areaSqFt.toString()} ${t("sqFt")}`
                      : ""}
                  </p>
                </div>
                <Link
                  href={`/properties/${propertyId}/rooms/${room.id}/understanding`}
                  className="font-body text-xs font-medium text-laterite hover:underline"
                >
                  {t("confirmDimensions")}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-paper-raised pt-6">
          <h3 className="font-body text-sm font-semibold text-ink">
            {t("addRoomHeading")}
          </h3>
          <CreateRoomForm propertyId={propertyId} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-lg font-semibold">
          {t("designsHeading")}
        </h2>
        {designProjects.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ink-soft">
            {t("noDesignsYet")}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-paper-raised">
            {designProjects.map((project: DesignProjectSummary) => (
              <li key={project.id} className="py-3">
                <Link
                  href={`/designs/${project.id}`}
                  className="group flex items-center justify-between"
                >
                  <span className="font-body text-sm font-medium text-ink group-hover:text-laterite">
                    {project.name}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">
                    {project.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-paper-raised pt-6">
          <h3 className="font-body text-sm font-semibold text-ink">
            {t("startDesignHeading")}
          </h3>
          <CreateDesignProjectForm
            propertyId={propertyId}
            rooms={roomsForClient}
          />
        </div>
      </div>
    </div>
  );
}
