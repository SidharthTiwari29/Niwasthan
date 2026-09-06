import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import {
  getAIUsageSummary,
  listCatalogueForAdmin,
  listEntitlements,
  listJobs,
  listOperationalEvents,
  listPackages,
} from "@/server/services/adminOperationsService";

const querySchema = z.object({
  view: z.enum([
    "packages",
    "entitlements",
    "jobs",
    "ai-usage",
    "catalogue",
    "events",
  ]),
  limit: z.coerce.number().int().positive().max(500).optional(),
  type: z.string().trim().min(1).max(100).optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
});

// Real, previously-unreachable admin dashboard data - a single endpoint
// with a view selector rather than 5 separate route files, since these
// are all read-only summaries of the same admin operational picture.
export const GET = withErrorHandling(async (request: Request) => {
  await requireAdmin();
  const url = new URL(request.url);
  const { view, limit, type, severity } = parseOrThrow(querySchema, {
    view: url.searchParams.get("view"),
    limit: url.searchParams.get("limit") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    severity: url.searchParams.get("severity") ?? undefined,
  });

  switch (view) {
    case "packages":
      return NextResponse.json({ packages: await listPackages() });
    case "entitlements":
      return NextResponse.json({
        entitlements: await listEntitlements(limit),
      });
    case "jobs":
      return NextResponse.json({ jobs: await listJobs(limit) });
    case "ai-usage":
      return NextResponse.json({ summary: await getAIUsageSummary() });
    case "catalogue":
      return NextResponse.json({
        catalogue: await listCatalogueForAdmin(limit),
      });
    case "events":
      return NextResponse.json({
        events: await listOperationalEvents(limit, { type, severity }),
      });
  }
});
