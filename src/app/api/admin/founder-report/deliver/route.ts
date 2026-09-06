import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { generateFounderReportMetrics } from "@/server/operations/founderReportService";
import { sendFounderReportEmail } from "@/server/operations/founderReportEmail";

const bodySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

// Real, on-demand delivery (docs/AGENTIC-OPERATIONS.md section 13's
// "on demand: founder-triggered Process Lead analysis") - computes the
// real metrics fresh, then sends them to the real, configured founder
// address. No snapshot persistence yet (section 12's "email must be
// generated from a persisted report snapshot so the report can be
// reproduced and audited later" is real, separate future work this
// endpoint would sit in front of), and no automated daily cadence yet
// either - this is the real, manually-triggered path only.
export const POST = withErrorHandling(async (request: Request) => {
  await requireAdmin();
  const { start, end } = parseOrThrow(bodySchema, await request.json());

  const metrics = await generateFounderReportMetrics({
    start: new Date(start),
    end: new Date(end),
  });
  await sendFounderReportEmail(metrics);

  return NextResponse.json({ delivered: true });
});
