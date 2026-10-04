import { NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handler";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { propertyService } from "@/server/services/propertyService";
import { roomService } from "@/server/services/roomService";
import { listDesignProjectsForProperty } from "@/server/services/designProjectService";

// Real, mobile-specific route reusing the exact same real assembly the
// web dashboard uses (src/app/(app)/properties/page.tsx) - the same
// three service calls per property, never a separate or simplified
// data shape that could silently drift from what the web app shows
// for the same real account.
export const GET = withErrorHandling(async () => {
  const { userId } = await requireMobileAuth();
  const properties = await propertyService.list(userId);
  const dashboardProperties = await Promise.all(
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
  return NextResponse.json({ properties: dashboardProperties });
});
