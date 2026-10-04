import { NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handler";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { propertyService } from "@/server/services/propertyService";
import { budgetService } from "@/server/services/budgetService";

// Real, mobile-specific route for the Budget tab, same featured-
// property convention as the other mobile routes. Deliberately exposes
// only fields directly confirmed against the real schema/repository
// (BudgetVersion is raw-SQL only, not a Prisma model with checkable
// field types) - totalTargetMinor and the plan's own real lock state,
// never an invented "confidence score" this session cannot verify the
// real meaning of.
export const GET = withErrorHandling(async () => {
  const { userId } = await requireMobileAuth();
  const properties = await propertyService.list(userId);
  const featured = properties[0];
  if (!featured) {
    return NextResponse.json({ propertyName: null, budget: null });
  }
  const result = await budgetService.get(featured.id, userId);
  if (!result) {
    return NextResponse.json({
      propertyName: featured.name,
      budget: null,
    });
  }
  const latest = result.versions[0];
  return NextResponse.json({
    propertyName: featured.name,
    budget: {
      currency: result.plan.currency,
      status: result.plan.status,
      lockedVersion: result.plan.lockedVersion,
      latestVersion: latest
        ? {
            version: latest.version,
            totalLowMinor: latest.totalLowMinor,
            totalTargetMinor: latest.totalTargetMinor,
            totalHighMinor: latest.totalHighMinor,
            isLocked: result.plan.lockedVersion === latest.version,
          }
        : null,
    },
  });
});
