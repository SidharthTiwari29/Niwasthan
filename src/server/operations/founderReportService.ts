import { prisma } from "@/server/db/prisma";

export type ReportPeriod = { start: Date; end: Date };

export type FounderReportMetrics = {
  period: ReportPeriod;
  generatedAt: Date;
  // Section 3 (Customer Activity) - real, counted facts for the period.
  customerActivity: {
    newCustomers: number;
    propertiesCreated: number;
    floorPlansUploaded: number;
    designsGenerated: number;
  };
  // Section 4 (Commercial Performance) - real, authoritative sales data.
  // Only PAID purchases count as real sales; CREATED/FAILED/REFUNDED/
  // CANCELLED are real facts too, but never counted as revenue.
  commercialPerformance: {
    paidOrders: number;
    grossSalesMinor: number;
    // Null rather than a divide-by-zero fabrication when there were no
    // real orders in the period - an honest absence, not a false zero.
    averageOrderValueMinor: number | null;
  };
  // Section 6 (Concerns) - a real, direct read of currently-open
  // incidents (AgentIncident), not an estimate or a summary.
  openIncidents: {
    critical: number;
    error: number;
    total: number;
  };
  // Per section 19 ("No fabricated management intelligence"): sections
  // of the full report structure (docs/AGENTIC-OPERATIONS.md section
  // 11) that require real judgment, interpretation, or diagnostic
  // reasoning - executive health assessment, ranked positive signals,
  // root-cause/trend analysis, improvement recommendations - have no
  // real reasoning system behind them yet. Listing them here as
  // explicitly unavailable is the honest choice; inventing
  // plausible-sounding text for them would be exactly the fabrication
  // this whole document exists to prevent.
  notYetAvailable: string[];
};

const NOT_YET_AVAILABLE_SECTIONS = [
  "Executive health assessment",
  "What is working well (ranked positive signals)",
  "Value created (savings identified/accepted/realised)",
  "Root-cause / trend analysis",
  "What the agents fixed (no autonomous remediation exists yet)",
  "Areas of improvement (recommendations)",
];

// Real, honest metrics for the Business Intelligence contract (section
// 10) and the computable portion of the Founder Report (section 11).
// Every number here is a direct, authoritative count or sum from the
// real domain tables for the given period - never an estimate,
// projection, or inference. Sections requiring real reasoning are
// explicitly listed as unavailable rather than fabricated.
export async function generateFounderReportMetrics(
  period: ReportPeriod,
): Promise<FounderReportMetrics> {
  const dateFilter = { gte: period.start, lt: period.end };

  const [
    newCustomers,
    propertiesCreated,
    floorPlansUploaded,
    designsGenerated,
    paidPurchases,
    openIncidentsBySeverity,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: dateFilter } }),
    prisma.property.count({ where: { createdAt: dateFilter } }),
    prisma.floorPlan.count({ where: { createdAt: dateFilter } }),
    prisma.designVersion.count({ where: { createdAt: dateFilter } }),
    prisma.purchase.findMany({
      where: { status: "PAID", createdAt: dateFilter },
      select: { amountMinor: true },
    }),
    prisma.agentIncident.groupBy({
      by: ["severity"],
      where: { status: { notIn: ["RESOLVED", "VERIFIED"] } },
      _count: { _all: true },
    }),
  ]);

  const paidOrders = paidPurchases.length;
  const grossSalesMinor = paidPurchases.reduce(
    (sum: number, p: { amountMinor: bigint }) => sum + Number(p.amountMinor),
    0,
  );

  const criticalCount =
    openIncidentsBySeverity.find(
      (g: { severity: string; _count: { _all: number } }) =>
        g.severity === "CRITICAL",
    )?._count._all ?? 0;
  const errorCount =
    openIncidentsBySeverity.find(
      (g: { severity: string; _count: { _all: number } }) =>
        g.severity === "ERROR",
    )?._count._all ?? 0;

  return {
    period,
    generatedAt: new Date(),
    customerActivity: {
      newCustomers,
      propertiesCreated,
      floorPlansUploaded,
      designsGenerated,
    },
    commercialPerformance: {
      paidOrders,
      grossSalesMinor,
      averageOrderValueMinor:
        paidOrders > 0 ? Math.round(grossSalesMinor / paidOrders) : null,
    },
    openIncidents: {
      critical: criticalCount,
      error: errorCount,
      total: criticalCount + errorCount,
    },
    notYetAvailable: NOT_YET_AVAILABLE_SECTIONS,
  };
}
