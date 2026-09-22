import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { createAndDeliverFounderReport } from "@/server/operations/processReportService";

const bodySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

// On-demand founder delivery now follows the README reporting flow:
// generate validated facts, persist one reproducible snapshot, then deliver
// from that exact snapshot with an idempotent delivery record.
export const POST = withErrorHandling(async (request: Request) => {
  await requireAdmin();
  const { start, end } = parseOrThrow(bodySchema, await request.json());

  const result = await createAndDeliverFounderReport({
    start: new Date(start),
    end: new Date(end),
  });

  return NextResponse.json({
    delivered: true,
    reportId: result.report.id,
    deliveryId: result.delivery.id,
    deduplicated: result.deduplicated,
  });
});
