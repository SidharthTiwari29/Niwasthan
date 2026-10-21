import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { generateFounderReportMetrics } from "./founderReportService";
import { correlateProcessLead } from "./processLeadService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    agentObservation: { findMany: vi.fn() },
    agentEscalation: { count: vi.fn() },
    agentIncident: { count: vi.fn() },
    operationalEvent: { count: vi.fn() },
  },
}));

vi.mock("./founderReportService", () => ({
  generateFounderReportMetrics: vi.fn(),
}));

const db = vi.mocked(prisma, { deep: true });
const mockedMetrics = vi.mocked(generateFounderReportMetrics);

const period = {
  start: new Date("2026-09-01"),
  end: new Date("2026-09-02"),
};

describe("correlateProcessLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.agentObservation.findMany.mockResolvedValue([]);
    db.agentEscalation.count.mockResolvedValue(0);
    db.agentIncident.count.mockResolvedValue(0);
    db.operationalEvent.count.mockResolvedValue(0);
    mockedMetrics.mockResolvedValue({
      notYetAvailable: ["Executive health assessment"],
    } as never);
  });

  it("is always classified VERIFIED_FACT - every field is a direct count or a real relation, never an inference", async () => {
    const result = await correlateProcessLead(period);
    expect(result.classification).toBe("VERIFIED_FACT");
  });

  it("filters observations by the real createdAt period bounds given, not an implicit default range", async () => {
    await correlateProcessLead(period);

    expect(db.agentObservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdAt: { gte: period.start, lt: period.end } },
      }),
    );
  });

  it("only counts OPEN escalations and non-terminal incidents - never resolved ones, which would misrepresent current operational state", async () => {
    await correlateProcessLead(period);

    expect(db.agentEscalation.count).toHaveBeenCalledWith({
      where: { status: "OPEN" },
    });
    expect(db.agentIncident.count).toHaveBeenCalledWith({
      where: { status: { notIn: ["RESOLVED", "VERIFIED"] } },
    });
  });

  it("correlates signals across every specialist agent present, not just one hardcoded agent - the real cross-agent correlation the Process Lead role requires", async () => {
    db.agentObservation.findMany.mockResolvedValue([
      {
        agentName: "EXECUTION_QUALITY",
        capability: "EXECUTION_AND_QUALITY",
        classification: "READY_FOR_HANDOVER",
        id: "obs-1",
        decisions: [{ actions: [{}] }],
      },
      {
        agentName: "BOQ_BUDGET",
        capability: "BOQ_AND_BUDGET",
        classification: "TRADE_OFF_AVAILABLE",
        id: "obs-2",
        decisions: [{ actions: [{}, {}] }, { actions: [] }],
      },
    ] as never);

    const result = await correlateProcessLead(period);

    expect(result.specialistSignals).toEqual([
      {
        agentName: "EXECUTION_QUALITY",
        capability: "EXECUTION_AND_QUALITY",
        classification: "READY_FOR_HANDOVER",
        observationId: "obs-1",
        decisionCount: 1,
        actionCount: 1,
      },
      {
        agentName: "BOQ_BUDGET",
        capability: "BOQ_AND_BUDGET",
        classification: "TRADE_OFF_AVAILABLE",
        observationId: "obs-2",
        decisionCount: 2,
        actionCount: 2,
      },
    ]);
  });

  it("never substitutes its own correlation counts for the authoritative founder-report metrics - unresolvedSections comes straight from generateFounderReportMetrics", async () => {
    mockedMetrics.mockResolvedValueOnce({
      notYetAvailable: ["Root-cause / trend analysis", "Areas of improvement"],
    } as never);

    const result = await correlateProcessLead(period);

    expect(result.unresolvedSections).toEqual([
      "Root-cause / trend analysis",
      "Areas of improvement",
    ]);
  });
});
