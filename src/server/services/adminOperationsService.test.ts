import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import {
  getAIUsageSummary,
  listEntitlements,
  listJobs,
  listOperationalEvents,
} from "./adminOperationsService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    package: { findMany: vi.fn() },
    entitlement: { findMany: vi.fn() },
    aIJob: { findMany: vi.fn(), groupBy: vi.fn() },
    catalogueItem: { findMany: vi.fn() },
    operationalEvent: { findMany: vi.fn() },
  },
}));

const db = vi.mocked(prisma, { deep: true });

describe("adminOperationsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clamps entitlement and job list limits to the server maximum", async () => {
    db.entitlement.findMany.mockResolvedValue([] as never);
    db.aIJob.findMany.mockResolvedValue([] as never);

    await listEntitlements(5000);
    await listJobs(5000);

    expect(db.entitlement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 }),
    );
    expect(db.aIJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 }),
    );
  });

  it("normalizes missing providers in AI usage summaries", async () => {
    db.aIJob.groupBy.mockResolvedValue([
      { provider: null, status: "SUCCEEDED", _count: { _all: 3 } },
      { provider: "openai", status: "FAILED", _count: { _all: 1 } },
    ] as never);

    await expect(getAIUsageSummary()).resolves.toEqual([
      { provider: "unconfigured", status: "SUCCEEDED", jobs: 3 },
      { provider: "openai", status: "FAILED", jobs: 1 },
    ]);
  });

  it("clamps the real operational events list limit to the server maximum, same as the other admin list views", async () => {
    db.operationalEvent.findMany.mockResolvedValue([] as never);

    await listOperationalEvents(5000);

    expect(db.operationalEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 }),
    );
  });

  it("orders real operational events by most recent first", async () => {
    db.operationalEvent.findMany.mockResolvedValue([] as never);

    await listOperationalEvents();

    expect(db.operationalEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { occurredAt: "desc" } }),
    );
  });

  it("filters real operational events by type and severity when given", async () => {
    db.operationalEvent.findMany.mockResolvedValue([] as never);

    await listOperationalEvents(100, {
      type: "FLOOR_PLAN_ANALYSIS_FAILED",
      severity: "ERROR",
    });

    expect(db.operationalEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: "FLOOR_PLAN_ANALYSIS_FAILED", severity: "ERROR" },
      }),
    );
  });

  it("real, honest default: no filter given means no filter applied - never a fabricated 'no incidents' view", async () => {
    db.operationalEvent.findMany.mockResolvedValue([] as never);

    await listOperationalEvents();

    expect(db.operationalEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: undefined, severity: undefined },
      }),
    );
  });
});
