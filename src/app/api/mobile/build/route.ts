import { NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handler";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { propertyService } from "@/server/services/propertyService";
import { getPropertyLifecycle } from "@/server/services/propertyLifecycleService";

type StageState = "complete" | "active" | "attention" | "not-started";

// Real, mobile-specific route for the Build tab, deriving the same
// four real milestones the existing mobile UI already names (design
// lock, BOQ/quote review, site reality check, installation/snagging)
// from the exact same real procurement/order/execution/snag records
// the web lifecycle page uses - never a separate or simplified truth
// that could disagree with what the website shows for the same
// account.
export const GET = withErrorHandling(async () => {
  const { userId } = await requireMobileAuth();
  const properties = await propertyService.list(userId);
  const featured = properties[0];
  if (!featured) {
    return NextResponse.json({ propertyName: null, milestones: null });
  }
  const lifecycle = await getPropertyLifecycle(featured.id, userId);
  if (!lifecycle) {
    return NextResponse.json({ propertyName: featured.name, milestones: null });
  }

  const request = lifecycle.requests[0];
  const order = request?.orders[0];
  const execution = order?.executions[0];
  const openSnags =
    execution?.snags.filter(
      (snag) => snag.status !== "RESOLVED" && snag.status !== "ACCEPTED",
    ).length ?? 0;

  const milestones: Array<{ label: string; state: StageState }> = [
    {
      label: "Design lock",
      state: request ? "complete" : "not-started",
    },
    {
      label: "BOQ and quote review",
      state: order
        ? "complete"
        : request && request.quoteCount > 0
          ? "active"
          : "not-started",
    },
    {
      label: "Site reality check",
      state: execution
        ? execution.status === "SCHEDULED" || execution.status === "IN_PROGRESS"
          ? "active"
          : "complete"
        : "not-started",
    },
    {
      label: "Installation and snagging",
      state: !execution
        ? "not-started"
        : openSnags > 0
          ? "attention"
          : execution.status === "COMPLETED" || execution.status === "RESOLVED"
            ? "complete"
            : "active",
    },
  ];

  return NextResponse.json({
    propertyName: featured.name,
    milestones,
    openSnagCount: openSnags,
  });
});
