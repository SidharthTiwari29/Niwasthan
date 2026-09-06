import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { emitEvent } from "./eventEmitter";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    operationalEvent: { create: vi.fn() },
  },
}));

const db = vi.mocked(prisma, { deep: true });

describe("emitEvent", () => {
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => consoleErrorSpy.mockClear());

  it("records a real event with every real field correctly mapped", async () => {
    db.operationalEvent.create.mockResolvedValue({} as never);

    await emitEvent({
      type: "FLOOR_PLAN_ANALYSIS_STARTED",
      actorType: "system",
      userId: "user-1",
      propertyId: "property-1",
      correlationId: "analysis-1",
      domainType: "FloorPlan",
      domainId: "floor-plan-1",
      severity: "WARNING",
      currentState: "ANALYZING",
      previousState: "PENDING",
      metadata: { source: "gemini" },
    });

    expect(db.operationalEvent.create).toHaveBeenCalledWith({
      data: {
        type: "FLOOR_PLAN_ANALYSIS_STARTED",
        actorType: "system",
        actorId: undefined,
        userId: "user-1",
        propertyId: "property-1",
        projectId: undefined,
        correlationId: "analysis-1",
        causationId: undefined,
        domainType: "FloorPlan",
        domainId: "floor-plan-1",
        severity: "WARNING",
        currentState: "ANALYZING",
        previousState: "PENDING",
        metadata: { source: "gemini" },
      },
    });
  });

  it("defaults severity to INFO when none is given - a real fact being recorded, not an incident", async () => {
    db.operationalEvent.create.mockResolvedValue({} as never);

    await emitEvent({ type: "PROPERTY_CREATED" });

    expect(db.operationalEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "INFO" }),
      }),
    );
  });

  it("never throws when the real database write fails - a real event-logging outage must never break the domain operation being described", async () => {
    db.operationalEvent.create.mockRejectedValue(
      new Error("real database connection failure"),
    );

    await expect(
      emitEvent({ type: "FLOOR_PLAN_ANALYSIS_FAILED" }),
    ).resolves.toBeUndefined();
  });

  it("surfaces a genuine event-logging failure to the server's own error output, rather than losing it silently", async () => {
    db.operationalEvent.create.mockRejectedValue(
      new Error("real database connection failure"),
    );

    await emitEvent({ type: "FLOOR_PLAN_ANALYSIS_FAILED" });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("emitEvent failed"),
      expect.objectContaining({ type: "FLOOR_PLAN_ANALYSIS_FAILED" }),
    );
  });
});
