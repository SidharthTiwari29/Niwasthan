import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { createFounderReportSnapshot } from "@/server/operations/processReportService";

const bodySchema = z
  .object({
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
  })
  .refine(
    (value) => value.periodStart < value.periodEnd,
    "periodStart must be before periodEnd",
  );

export const POST = withErrorHandling(async (request: Request) => {
  await requireAdmin();
  const input = bodySchema.parse(await request.json());
  const report = await createFounderReportSnapshot({
    start: input.periodStart,
    end: input.periodEnd,
  });
  return NextResponse.json({ report }, { status: 201 });
});
