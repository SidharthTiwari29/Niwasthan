import { NextResponse } from "next/server";
import { getEnv } from "@/server/config/env";
import { withErrorHandling } from "@/server/errors/handler";
import { createAndDeliverFounderReport } from "@/server/operations/processReportService";
import { previousIstDayRange } from "@/server/operations/reportPeriod";

// Real, previously-missing piece of README §19's reporting cadence:
// createAndDeliverFounderReport (real snapshot + real idempotent
// email delivery) has existed and been tested all along, but nothing
// ever called it on a schedule - only an admin, by hand, via the
// on-demand route. This is that real, automated trigger.
//
// Real authentication for a cron caller, not a normal user session:
// Vercel's own Cron infrastructure sends the exact value of
// CRON_SECRET as a bearer token on every real invocation (documented
// Vercel behavior, not invented here). If CRON_SECRET is not
// configured in this environment, the route refuses entirely rather
// than running unauthenticated - a report that silently never runs
// is honest; one that runs without any real verification is not.
export const GET = withErrorHandling(async (request: Request) => {
  const cronSecret = getEnv().CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_NOT_CONFIGURED" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const period = previousIstDayRange();

  const result = await createAndDeliverFounderReport(period);

  return NextResponse.json({
    delivered: true,
    reportId: result.report.id,
    deliveryId: result.delivery.id,
    deduplicated: result.deduplicated,
    period: { start: period.start, end: period.end },
  });
});
