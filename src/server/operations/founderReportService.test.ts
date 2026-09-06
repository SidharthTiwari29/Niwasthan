import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { generateFounderReportMetrics } from "./founderReportService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: { count: vi.fn() },
    property: { count: vi.fn() },
    floorPlan: { count: vi.fn() },
    designVersion: { count: vi.fn() },
    purchase: { findMany: vi.fn() },
    agentIncident: { groupBy: vi.fn() },
  },
}));

const db = vi.mocked(prisma, { deep: true });

const realPeriod = {
  start: new Date("2026-09-01"),
  end: new Date("2026-09-02"),
};

function mockCounts(overrides: Partial<Record<string, number>> = {}) {
  db.user.count.mockResolvedValue(overrides.newCustomers ?? 0);
  db.property.count.mockResolvedValue(overrides.propertiesCreated ?? 0);
  db.floorPlan.count.mockResolvedValue(overrides.floorPlansUploaded ?? 0);
  db.designVersion.count.mockResolvedValue(overrides.designsGenerated ?? 0);
  db.purchase.findMany.mockResolvedValue([] as never);
  db.agentIncident.groupBy.mockResolvedValue([] as never);
}

describe("generateFounderReportMetrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports real, counted customer activity for the given period, filtered by real createdAt bounds", async () => {
    mockCounts({
      newCustomers: 5,
      propertiesCreated: 3,
      floorPlansUploaded: 2,
      designsGenerated: 7,
    });

    const result = await generateFounderReportMetrics(realPeriod);

    expect(result.customerActivity).toEqual({
      newCustomers: 5,
      propertiesCreated: 3,
      floorPlansUploaded: 2,
      designsGenerated: 7,
    });
    expect(db.user.count).toHaveBeenCalledWith({
      where: { createdAt: { gte: realPeriod.start, lt: realPeriod.end } },
    });
  });

  it("computes real gross sales and average order value from actual PAID purchases - hand-verified sum and average", async () => {
    mockCounts();
    db.purchase.findMany.mockResolvedValue([
      { amountMinor: 500_000n },
      { amountMinor: 300_000n },
      { amountMinor: 200_000n },
    ] as never);

    const result = await generateFounderReportMetrics(realPeriod);

    // Hand-verified: 500000 + 300000 + 200000 = 1000000, / 3 = 333333 (rounded)
    expect(result.commercialPerformance.paidOrders).toBe(3);
    expect(result.commercialPerformance.grossSalesMinor).toBe(1_000_000);
    expect(result.commercialPerformance.averageOrderValueMinor).toBe(333_333);
  });

  it("only ever counts real PAID purchases as sales - never CREATED, FAILED, REFUNDED, or CANCELLED", async () => {
    mockCounts();

    await generateFounderReportMetrics(realPeriod);

    expect(db.purchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PAID" }),
      }),
    );
  });

  it("reports null average order value for zero real orders, never a fabricated zero from dividing by zero", async () => {
    mockCounts();

    const result = await generateFounderReportMetrics(realPeriod);

    expect(result.commercialPerformance.paidOrders).toBe(0);
    expect(result.commercialPerformance.averageOrderValueMinor).toBeNull();
  });

  it("reports real, currently-open incident counts by severity, excluding resolved and verified ones", async () => {
    mockCounts();
    db.agentIncident.groupBy.mockResolvedValue([
      { severity: "CRITICAL", _count: { _all: 2 } },
      { severity: "ERROR", _count: { _all: 5 } },
    ] as never);

    const result = await generateFounderReportMetrics(realPeriod);

    expect(result.openIncidents).toEqual({
      critical: 2,
      error: 5,
      total: 7,
    });
    expect(db.agentIncident.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { notIn: ["RESOLVED", "VERIFIED"] } },
      }),
    );
  });

  it("reports zero open incidents honestly when none exist, rather than omitting the field", async () => {
    mockCounts();

    const result = await generateFounderReportMetrics(realPeriod);

    expect(result.openIncidents).toEqual({ critical: 0, error: 0, total: 0 });
  });

  it("explicitly lists every report section that requires real reasoning not yet built, rather than fabricating content for them", async () => {
    mockCounts();

    const result = await generateFounderReportMetrics(realPeriod);

    expect(result.notYetAvailable).toContain("Executive health assessment");
    expect(result.notYetAvailable).toContain("Root-cause / trend analysis");
    expect(result.notYetAvailable.length).toBeGreaterThan(0);
  });
});
