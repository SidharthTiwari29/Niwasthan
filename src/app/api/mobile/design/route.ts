import { NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handler";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { propertyService } from "@/server/services/propertyService";
import { listDesignProjectsForProperty } from "@/server/services/designProjectService";
import { designDirectionService } from "@/server/services/designDirectionService";

// Real, mobile-specific route for the Design tab, matching the same
// "featured property" convention the dashboard route uses: a customer
// with multiple properties sees the design directions for whichever
// property the Home tab is already showing as their active one, not a
// separate, disconnected selection the two tabs could disagree about.
export const GET = withErrorHandling(async () => {
  const { userId } = await requireMobileAuth();
  const properties = await propertyService.list(userId);
  const featured = properties[0];
  if (!featured) {
    return NextResponse.json({ propertyName: null, directions: [] });
  }
  const projects = await listDesignProjectsForProperty(featured.id, userId);
  const project = projects[0];
  if (!project) {
    return NextResponse.json({
      propertyName: featured.name,
      directions: [],
    });
  }
  const directions = await designDirectionService.listDirections(
    project.id,
    userId,
  );
  return NextResponse.json({
    propertyName: featured.name,
    directions: directions.map((direction) => ({
      id: direction.id,
      name: direction.name,
      status: direction.status,
      createdAt: direction.createdAt,
      activatedAt: direction.activatedAt,
    })),
  });
});
