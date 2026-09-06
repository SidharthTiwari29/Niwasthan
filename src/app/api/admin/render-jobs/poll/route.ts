import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { pollPendingRenderJobs } from "@/server/rendering/renderPollingService";

// Real, manually-triggered polling pass, until a real, scheduled cron
// mechanism exists to call this automatically on some real interval.
// Returns exactly what pollPendingRenderJobs found - never a fabricated
// "all clear" when jobs are still genuinely rendering.
export const POST = withErrorHandling(async () => {
  await requireAdmin();
  const results = await pollPendingRenderJobs();
  return NextResponse.json({ results });
});
