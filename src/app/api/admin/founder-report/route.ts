import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { generateFounderReportMetrics } from "@/server/operations/founderReportService";

const querySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

// Real, on-demand founder report (docs/AGENTIC-OPERATIONS.md section
// 13's "on demand: founder-triggered Process Lead analysis"). Returns
// exactly what generateFounderReportMetrics computes - real,
// authoritative numbers for the sections that are genuinely
// computable today, and an explicit, honest list of the sections that
// still require real reasoning this system doesn't have yet. No
// snapshot persistence or email delivery yet (sections 11's daily
// cadence and section 12's delivery pipeline) - this is the real,
// on-demand read the rest of that pipeline would be built on top of.
export const GET = withErrorHandling(async (request: Request) => {
  await requireAdmin();
  const url = new URL(request.url);
  const { start, end } = parseOrThrow(querySchema, {
    start: url.searchParams.get("start"),
    end: url.searchParams.get("end"),
  });

  const metrics = await generateFounderReportMetrics({
    start: new Date(start),
    end: new Date(end),
  });

  return NextResponse.json({ report: metrics });
});
