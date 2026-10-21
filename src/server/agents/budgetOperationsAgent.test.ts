import { beforeEach, describe, expect, it, vi } from "vitest";
import { observeBudgetAndAct } from "./budgetOperationsAgent";
import { projectOptimizationService } from "@/server/services/projectOptimizationService";
import { notificationService } from "@/server/services/notificationService";
import {
  assertAgentActionAllowed,
  beginActionAttempt,
  createAgentEscalation,
  finishActionAttempt,
} from "./agentGovernanceService";
import { prisma } from "@/server/db/prisma";

vi.mock("@/server/services/projectOptimizationService", () => ({
  projectOptimizationService: { optimize: vi.fn() },
}));

vi.mock("@/server/services/notificationService", () => ({
  notificationService: { notify: vi.fn() },
}));

vi.mock("./agentGovernanceService", () => ({
  assertAgentActionAllowed: vi.fn(),
  beginActionAttempt: vi.fn(),
  createAgentEscalation: vi.fn(),
  finishActionAttempt: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    agentObservation: { create: vi.fn() },
    agentDecision: { create: vi.fn() },
    agentAction: { create: vi.fn(), update: vi.fn() },
  },
}));

const mockedOptimize = vi.mocked(projectOptimizationService.optimize);
const mockedNotify = vi.mocked(notificationService.notify);
const mockedPrisma = vi.mocked(prisma, true);
const mockedBeginAttempt = vi.mocked(beginActionAttempt);
const mockedFinishAttempt = vi.mocked(finishActionAttempt);
const mockedAssertAllowed = vi.mocked(assertAgentActionAllowed);
const mockedEscalation = vi.mocked(createAgentEscalation);

function baseOptimization(overrides: Record<string, unknown> = {}) {
  return {
    budgetVersionId: "bv-1",
    version: 1,
    totalLowMinor: 90_000n,
    totalTargetMinor: 100_000n,
    totalHighMinor: 120_000n,
    rooms: [],
    recommendations: [],
    ...overrides,
  };
}

describe("budgetOperationsAgent.observeBudgetAndAct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.agentObservation.create.mockResolvedValue({
      id: "obs-1",
    } as never);
    mockedPrisma.agentDecision.create.mockResolvedValue({
      id: "dec-1",
    } as never);
    mockedPrisma.agentAction.create.mockResolvedValue({
      id: "act-1",
    } as never);
    mockedPrisma.agentAction.update.mockResolvedValue({
      id: "act-1",
    } as never);
    mockedBeginAttempt.mockResolvedValue({ id: "attempt-1" } as never);
  });

  it("returns null when the property has no budget plan yet", async () => {
    mockedOptimize.mockResolvedValueOnce(null);
    const result = await observeBudgetAndAct("prop-1", "owner-1");
    expect(result).toBeNull();
    expect(mockedPrisma.agentObservation.create).not.toHaveBeenCalled();
  });

  it("classifies ON_TRACK and skips the action without notifying, when no trade-off and within range", async () => {
    mockedOptimize.mockResolvedValueOnce(
      baseOptimization({
        totalTargetMinor: 100_000n,
        totalHighMinor: 120_000n,
      }),
    );

    await observeBudgetAndAct("prop-1", "owner-1");

    expect(mockedNotify).not.toHaveBeenCalled();
    expect(mockedPrisma.agentAction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SKIPPED" }),
      }),
    );
  });

  it("notifies and escalates when the target has reached its own high ceiling", async () => {
    mockedOptimize.mockResolvedValueOnce(
      baseOptimization({
        totalTargetMinor: 120_000n,
        totalHighMinor: 120_000n,
      }),
    );

    await observeBudgetAndAct("prop-1", "owner-1");

    expect(mockedEscalation).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "WARNING" }),
    );
    expect(mockedAssertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "NOTIFY_BUDGET_AT_HIGH_ENVELOPE" }),
    );
    expect(mockedNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: "BUDGET_EXCEEDED", userId: "owner-1" }),
    );
    expect(mockedFinishAttempt).toHaveBeenCalledWith(
      "attempt-1",
      expect.objectContaining({ status: "VERIFIED" }),
    );
  });

  it("notifies (without escalating) when a real cross-room trade-off is available", async () => {
    mockedOptimize.mockResolvedValueOnce(
      baseOptimization({
        totalTargetMinor: 100_000n,
        totalHighMinor: 120_000n,
        recommendations: [
          {
            fromRoomId: "kitchen",
            toRoomId: "bedroom",
            shiftMinor: 5_000n,
            rationale: "x",
            downstreamEffect: "y",
          },
        ],
      }),
    );

    await observeBudgetAndAct("prop-1", "owner-1");

    expect(mockedEscalation).not.toHaveBeenCalled();
    expect(mockedNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: "GENERAL", userId: "owner-1" }),
    );
  });

  it("never attempts to change any financial data itself - only ever calls notificationService", async () => {
    mockedOptimize.mockResolvedValueOnce(
      baseOptimization({
        totalTargetMinor: 120_000n,
        totalHighMinor: 120_000n,
      }),
    );

    await observeBudgetAndAct("prop-1", "owner-1");

    // The only side-channel this agent is allowed to reach is
    // notificationService - no budgetRepository/savingRepository import
    // exists in the module at all, which this test's own mock set
    // implicitly enforces: if the implementation ever called a real
    // write method on those, this test's mocks wouldn't provide one and
    // the test would throw.
    expect(mockedNotify).toHaveBeenCalledTimes(1);
  });
});
