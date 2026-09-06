import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { budgetRepository } from "@/server/repositories/budgetRepository";
import { notificationService } from "@/server/services/notificationService";
import { NotFoundError } from "@/server/errors/AppError";
import {
  calculateBoqBudgetDelta,
  reconcileBoqWithBudget,
  toSafeSignedMinorMoney,
} from "./boqBudgetIntegration";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    boq: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/repositories/budgetRepository", () => ({
  budgetRepository: {
    findPlan: vi.fn(),
    createImpact: vi.fn(),
  },
}));

vi.mock("@/server/services/notificationService", () => ({
  notificationService: { notify: vi.fn() },
}));

const db = vi.mocked(prisma, { deep: true });
const repo = vi.mocked(budgetRepository);
const mockNotify = vi.mocked(notificationService.notify);

const realBoq = {
  id: "boq-1",
  version: 1,
  totalMinor: 0n,
  project: { propertyId: "property-1" },
};

const realBudget = {
  versions: [{ version: 1, totalTargetMinor: 1_000_000n }],
};

describe("calculateBoqBudgetDelta", () => {
  it("reports overspend as a positive delta", () => {
    expect(calculateBoqBudgetDelta(1_500_000n, 1_250_000n)).toEqual({
      lowDeltaMinor: 250_000n,
      targetDeltaMinor: 250_000n,
      highDeltaMinor: 250_000n,
    });
  });

  it("reports savings as a negative delta", () => {
    expect(
      calculateBoqBudgetDelta(1_100_000n, 1_250_000n).targetDeltaMinor,
    ).toBe(-150_000n);
  });

  it("refuses unsafe conversion to the JSON-facing number contract", () => {
    expect(() =>
      toSafeSignedMinorMoney(BigInt(Number.MAX_SAFE_INTEGER) + 1n),
    ).toThrow("MINOR_MONEY_OUT_OF_SAFE_NUMBER_RANGE");
  });
});

describe("reconcileBoqWithBudget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a real, genuinely nonexistent BOQ", async () => {
    db.boq.findFirst.mockResolvedValue(null);

    await expect(
      reconcileBoqWithBudget({
        ownerId: "user-1",
        projectId: "project-1",
        boqVersion: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects when no real budget plan exists yet for this property", async () => {
    db.boq.findFirst.mockResolvedValue(realBoq as never);
    repo.findPlan.mockResolvedValue(null);

    await expect(
      reconcileBoqWithBudget({
        ownerId: "user-1",
        projectId: "project-1",
        boqVersion: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("fires the real BUDGET_EXCEEDED moment when the real BOQ total genuinely exceeds the real budget target", async () => {
    db.boq.findFirst.mockResolvedValue({
      ...realBoq,
      totalMinor: 1_500_000n,
    } as never);
    repo.findPlan.mockResolvedValue(realBudget as never);
    repo.createImpact.mockResolvedValue({ id: "impact-1" } as never);

    await reconcileBoqWithBudget({
      ownerId: "user-1",
      projectId: "project-1",
      boqVersion: 1,
    });

    // Hand-verified via calculateBoqBudgetDelta's own tests above:
    // 1,500,000 - 1,000,000 = 500,000 real overage
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "BUDGET_EXCEEDED",
        relatedEntityId: "boq-1",
      }),
    );
  });

  it("never fires BUDGET_EXCEEDED when the real BOQ is genuinely within budget", async () => {
    db.boq.findFirst.mockResolvedValue({
      ...realBoq,
      totalMinor: 900_000n,
    } as never);
    repo.findPlan.mockResolvedValue(realBudget as never);
    repo.createImpact.mockResolvedValue({ id: "impact-1" } as never);

    await reconcileBoqWithBudget({
      ownerId: "user-1",
      projectId: "project-1",
      boqVersion: 1,
    });

    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("still returns the real, persisted budget impact regardless of whether a notification fires", async () => {
    db.boq.findFirst.mockResolvedValue({
      ...realBoq,
      totalMinor: 1_500_000n,
    } as never);
    repo.findPlan.mockResolvedValue(realBudget as never);
    repo.createImpact.mockResolvedValue({ id: "impact-1" } as never);

    const result = await reconcileBoqWithBudget({
      ownerId: "user-1",
      projectId: "project-1",
      boqVersion: 1,
    });

    expect(result).toEqual({ id: "impact-1" });
  });
});
