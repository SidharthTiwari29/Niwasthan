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
    <div className="space-y-10">
      <Link
        href="/properties"
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        {t("backToHomes")}
      </Link>
      <section className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-8 text-paper shadow-xl shadow-ink/10 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-brass/25" />
        <div className="relative max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-paper/55"><span className="rounded-full bg-paper/10 px-2.5 py-1 text-brass">Active home</span><span>{t("propertyIdLabel", { id: property.id })}</span></div>
          <h1 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.84] tracking-[-0.06em]">{property.name}</h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-body text-sm text-paper/65">{property.address ? <span>{property.address}</span> : null}{property.city ? <span>{property.city}</span> : null}{property.propertyType ? <span>{PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType}</span> : null}</div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={`/properties/${propertyId}/intelligence`} className="inline-flex items-center gap-2 rounded-full bg-brass px-5 py-3 font-body text-sm font-semibold text-ink">Open intelligence ↗</Link><Link href={`/properties/${propertyId}/floor-plan`} className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-3 font-body text-sm text-paper/80 transition-colors hover:border-brass">{t("uploadFloorPlan")} →</Link><Link href={`/properties/${propertyId}/floor-plan/review`} className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-3 font-body text-sm text-paper/80 transition-colors hover:border-brass">{t("reviewDetectedRooms")} →</Link></div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">Home truth</p><p className="mt-3 font-display text-3xl font-semibold">{rooms.length > 0 ? "In progress" : "Not started"}</p><p className="mt-2 font-body text-xs leading-relaxed text-ink-soft">{rooms.length > 0 ? `${rooms.length} room${rooms.length === 1 ? "" : "s"} represented in the home model.` : "Add a plan or room to begin the spatial model."}</p></div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">Budget basis</p><p className="mt-3 font-display text-3xl font-semibold">{targetBudgetRupees !== null ? `₹${targetBudgetRupees.toLocaleString("en-IN")}` : "Unknown"}</p><p className="mt-2 font-body text-xs leading-relaxed text-ink-soft">Target only until quantities, products, and evidence are confirmed.</p></div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">Design directions</p><p className="mt-3 font-display text-3xl font-semibold">{designProjects.length}</p><p className="mt-2 font-body text-xs leading-relaxed text-ink-soft">A direction becomes meaningful when its downstream impact is visible.</p></div>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-ink/10 bg-white px-6 py-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">After the decision</p><p className="mt-2 font-display text-2xl font-semibold">Build & handover stays visible.</p><p className="mt-1 font-body text-sm text-ink-soft">Quotes, orders, delivery, installation, snags, and handover appear from real records.</p></div><div className="flex flex-wrap gap-2"><Link href={`/properties/${propertyId}/intelligence`} className="rounded-full border border-ink/15 px-4 py-3 font-body text-sm font-semibold text-ink">What-if & Smart Home</Link><Link href={`/properties/${propertyId}/procurement`} className="rounded-full border border-ink/15 px-4 py-3 font-body text-sm font-semibold text-ink">Compare quotes</Link><Link href={`/properties/${propertyId}/progress`} className="rounded-full bg-ink px-5 py-3 font-body text-sm font-semibold text-paper">Open lifecycle →</Link></div></section>
      <section className="rounded-[1.5rem] border border-ink/10 bg-[#e9e1d5] p-6 md:p-8"><div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end"><div><p className="font-mono text-[9px] uppercase tracking-[0.22em] text-laterite">Next best step</p><h2 className="mt-3 font-display text-4xl font-semibold leading-[0.92] tracking-[-0.045em]">Make the real home more legible.</h2><p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-ink-soft">Confirm the unknowns before choosing a look. Niwasthan will carry this context into design, catalogue, budget, and buildability.</p></div><Link href={rooms.length > 0 ? `/properties/${propertyId}/rooms/${rooms[0]?.id}/understanding` : `/properties/${propertyId}/floor-plan`} className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 font-body text-sm font-semibold text-paper">{rooms.length > 0 ? t("confirmDimensions") : t("uploadFloorPlan")} →</Link></div></section>
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
