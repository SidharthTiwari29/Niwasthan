import { prisma } from "@/server/db/prisma";

export function listPackages() {
  return prisma.package.findMany({ orderBy: { createdAt: "asc" } });
}
// Real, direct read of the Facts layer described in
// docs/AGENTIC-OPERATIONS.md section 5 - the first place these events
// become actually observable by a person, rather than only ever being
// written and never read. Deliberately just a filtered, ordered read;
// no interpretation, aggregation, or "health score" is computed here -
// those are the separate Observations/Incidents layers the same
// document describes and which do not exist yet.
export function listOperationalEvents(
  limit = 100,
  filter?: {
    type?: string;
    severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  },
) {
  return prisma.operationalEvent.findMany({
    where: {
      type: filter?.type,
      severity: filter?.severity,
    },
    orderBy: { occurredAt: "desc" },
    take: Math.min(limit, 500),
  });
}
export function listEntitlements(limit = 100) {
  return prisma.entitlement.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    include: {
      package: true,
      user: { select: { id: true, email: true, role: true } },
    },
  });
}
export function listJobs(limit = 100) {
  return prisma.aIJob.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    select: {
      id: true,
      projectId: true,
      type: true,
      status: true,
      provider: true,
      attempts: true,
      createdAt: true,
      completedAt: true,
      errorCode: true,
    },
  });
}
export async function getAIUsageSummary() {
  const rows = await prisma.aIJob.groupBy({
    by: ["provider", "status"],
    _count: { _all: true },
  });
  return rows.map((row) => ({
    provider: row.provider ?? "unconfigured",
    status: row.status,
    jobs: row._count._all,
  }));
}
export function listCatalogueForAdmin(limit = 100) {
  return prisma.catalogueItem.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    include: { prices: true },
  });
}
