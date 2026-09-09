import { requireAuth } from "@/server/middleware/requireAuth";
import { propertyService } from "@/server/services/propertyService";
import { roomService } from "@/server/services/roomService";
import { listDesignProjectsForProperty } from "@/server/services/designProjectService";
import { CreatePropertyForm } from "./CreatePropertyForm";
import { HomeDashboard, type DashboardProperty } from "./HomeDashboard";

export default async function PropertiesPage() {
  const { userId } = await requireAuth();
  const properties = await propertyService.list(userId);
  const dashboardProperties: DashboardProperty[] = await Promise.all(
    properties.map(async (property) => {
      const [rooms, designs] = await Promise.all([
        roomService.list(property.id, userId),
        listDesignProjectsForProperty(property.id, userId),
      ]);
      return {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        propertyType: property.propertyType,
        targetBudgetMinor: property.targetBudgetMinor,
        roomCount: rooms.length,
        designCount: designs.length,
      };
    }),
  );

  return (
    <div>
      <HomeDashboard properties={dashboardProperties} />
      <div className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white p-7 md:p-9">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em]">
          Create the property record
        </h2>
        <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-ink-soft">
          Keep the inputs grounded in your actual home. You can refine the
          details as evidence becomes available.
        </p>
        <CreatePropertyForm />
      </div>
    </div>
  );
}
