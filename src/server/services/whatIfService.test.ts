import { beforeEach, describe, expect, it, vi } from "vitest";
import { whatIfService } from "@/server/services/whatIfService";
import { budgetService } from "@/server/services/budgetService";
import { savingRepository } from "@/server/repositories/savingRepository";

vi.mock("@/server/services/budgetService", () => ({
  budgetService: { impact: vi.fn() },
}));

vi.mock("@/server/repositories/savingRepository", () => ({
  savingRepository: { create: vi.fn() },
}));

const mockBudgetImpact = vi.mocked(budgetService.impact);
const mockSavingCreate = vi.mocked(savingRepository.create);

describe("whatIfService", () => {
  it("calculates a deterministic saving and ranks alternatives", () => {
    const result = whatIfService.preview({
      baseVersion: 2,
      currentPriceMinor: 200000,
      proposedPriceMinor: 175000,
      roomId: null,
      scopeChange: "REPLACE",
      reason: "Use an equivalent lower-cost finish",
      designImpact: "SIMILAR",
      functionImpact: "SIMILAR",
      inputs: { source: "user" },
      candidates: [
        {
          id: "candidate-a",
          name: "Equivalent finish",
          priceMinor: 175000,
          qualityImpact: "SIMILAR",
          maintenanceImpact: "SIMILAR",
          durabilityImpact: "SIMILAR",
          appearanceImpact: "SIMILAR",
          explanation: "Same intended function with a lower observed price.",
          evidenceIds: ["evidence-1"],
        },
      ],
    });

    expect(result.savingMinor).toBe(25000n);
    expect(result.priceDeltaMinor).toBe(-25000n);
    expect(result.decision).toBe("SAVE");
    expect(result.rankedCandidates[0]?.savingMinor).toBe(25000n);
  });

  it("does not invent savings when a price is unknown", () => {
    const result = whatIfService.preview({
      baseVersion: 1,
      currentPriceMinor: null,
      proposedPriceMinor: null,
      roomId: null,
      scopeChange: "MODIFY",
      reason: "Price not established",
      designImpact: "UNKNOWN",
      functionImpact: "UNKNOWN",
      inputs: {},
      candidates: [],
    });

    expect(result.savingMinor).toBeNull();
    expect(result.priceDeltaMinor).toBeNull();
    expect(result.decision).toBe("UNKNOWN");
    expect(result.confidenceBps).toBe(5000);
  });

  describe("commit", () => {
    beforeEach(() => vi.clearAllMocks());

    it("creates a real README §9 ACCEPTED saving when the commit is a genuine, both-prices-known cost reduction", async () => {
      mockBudgetImpact.mockResolvedValue({ id: "impact-1" } as never);

      await whatIfService.commit("property-1", "owner-1", {
        baseVersion: 2,
        currentPriceMinor: 200000,
        proposedPriceMinor: 175000,
        proposedLowDeltaMinor: -30000,
        proposedTargetDeltaMinor: -25000,
        proposedHighDeltaMinor: -20000,
        roomId: null,
        scopeChange: "REPLACE",
        reason: "Use an equivalent lower-cost finish",
        designImpact: "SIMILAR",
        functionImpact: "SIMILAR",
        inputs: {},
      });

      expect(mockSavingCreate).toHaveBeenCalledWith({
        propertyId: "property-1",
        ownerId: "owner-1",
        budgetImpactId: "impact-1",
        currentPriceMinor: 200000n,
        proposedPriceMinor: 175000n,
        savingMinor: 25000n,
        reason: "Use an equivalent lower-cost finish",
      });
    });

    it("never records a saving for a genuine cost increase - a real, legitimate budget revision that is not a saving in README §9's sense", async () => {
      mockBudgetImpact.mockResolvedValue({ id: "impact-2" } as never);

      await whatIfService.commit("property-1", "owner-1", {
        baseVersion: 2,
        currentPriceMinor: 175000,
        proposedPriceMinor: 200000,
        proposedLowDeltaMinor: 20000,
        proposedTargetDeltaMinor: 25000,
        proposedHighDeltaMinor: 30000,
        roomId: null,
        scopeChange: "MODIFY",
        reason: "Upgrade to a higher-durability material",
        designImpact: "BETTER",
        functionImpact: "BETTER",
        inputs: {},
      });

      expect(mockSavingCreate).not.toHaveBeenCalled();
    });

    it("never records a saving when either real price is unknown - a saving amount cannot be real without both", async () => {
      mockBudgetImpact.mockResolvedValue({ id: "impact-3" } as never);

      await whatIfService.commit("property-1", "owner-1", {
        baseVersion: 2,
        currentPriceMinor: null,
        proposedPriceMinor: null,
        proposedLowDeltaMinor: -30000,
        proposedTargetDeltaMinor: -25000,
        proposedHighDeltaMinor: -20000,
        roomId: null,
        scopeChange: "REPLACE",
        reason: "Likely cheaper, price not yet confirmed",
        designImpact: "SIMILAR",
        functionImpact: "UNKNOWN",
        inputs: {},
      });

      expect(mockSavingCreate).not.toHaveBeenCalled();
    });

    it("rejects a committed target delta that does not match the real current and proposed prices, before ever reaching the saving-creation step", async () => {
      await expect(
        whatIfService.commit("property-1", "owner-1", {
          baseVersion: 2,
          currentPriceMinor: 200000,
          proposedPriceMinor: 175000,
          proposedLowDeltaMinor: -30000,
          // Within the real low/high range (-30000 to -20000, so it
          // passes the ordering check) but does not match the real
          // 175000 - 200000 = -25000 the known prices require.
          proposedTargetDeltaMinor: -22000,
          proposedHighDeltaMinor: -20000,
          roomId: null,
          scopeChange: "REPLACE",
          reason: "Mismatched delta",
          designImpact: "SIMILAR",
          functionImpact: "SIMILAR",
          inputs: {},
        }),
      ).rejects.toThrow(
        "Proposed target delta does not match the current and proposed prices",
      );

      expect(mockBudgetImpact).not.toHaveBeenCalled();
      expect(mockSavingCreate).not.toHaveBeenCalled();
    });
  });
});
