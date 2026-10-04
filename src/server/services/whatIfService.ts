import { ConflictError } from "@/server/errors/AppError";
import { budgetService } from "@/server/services/budgetService";
import { savingRepository } from "@/server/repositories/savingRepository";
import {
  rankSubstitutions,
  type SubstitutionCandidate,
} from "@/server/marketIntelligence/substitution";
import type {
  WhatIfCommitInput,
  WhatIfPreviewInput,
} from "@/server/validators/whatIf";

const impactScore = (value: "BETTER" | "SIMILAR" | "LOWER" | "UNKNOWN") => {
  switch (value) {
    case "BETTER":
      return 1000;
    case "SIMILAR":
      return 500;
    case "LOWER":
      return -1000;
    default:
      return 0;
  }
};

export const whatIfService = {
  preview(input: WhatIfPreviewInput) {
    const candidates: SubstitutionCandidate[] = input.candidates.map(
      (candidate) => ({
        ...candidate,
        priceMinor:
          candidate.priceMinor === null ? null : BigInt(candidate.priceMinor),
      }),
    );

    const ranked = rankSubstitutions(
      input.currentPriceMinor === null ? null : BigInt(input.currentPriceMinor),
      candidates,
    );

    const current =
      input.currentPriceMinor === null ? null : BigInt(input.currentPriceMinor);
    const proposed =
      input.proposedPriceMinor === null
        ? null
        : BigInt(input.proposedPriceMinor);
    const priceDeltaMinor =
      current === null || proposed === null ? null : proposed - current;
    const savingMinor = priceDeltaMinor === null ? null : -priceDeltaMinor;
    const confidenceBps = Math.max(
      0,
      Math.min(
        10000,
        5000 +
          impactScore(input.designImpact) / 2 +
          impactScore(input.functionImpact) / 2,
      ),
    );

    let decision: "UNKNOWN" | "SAVE" | "NEUTRAL" | "UPGRADE_COST";
    if (priceDeltaMinor === null) {
      decision = "UNKNOWN";
    } else if (savingMinor !== null && savingMinor > 0n) {
      decision = "SAVE";
    } else if (savingMinor === 0n) {
      decision = "NEUTRAL";
    } else {
      decision = "UPGRADE_COST";
    }

    return {
      scopeChange: input.scopeChange,
      roomId: input.roomId ?? null,
      reason: input.reason,
      priceDeltaMinor,
      savingMinor,
      confidenceBps,
      decision,
      rankedCandidates: ranked,
    };
  },

  async commit(propertyId: string, ownerId: string, input: WhatIfCommitInput) {
    const low = BigInt(input.proposedLowDeltaMinor);
    const target = BigInt(input.proposedTargetDeltaMinor);
    const high = BigInt(input.proposedHighDeltaMinor);

    if (low > target || target > high) {
      throw new ConflictError(
        "Proposed savings range must be ordered low, target, high",
      );
    }

    // A committed What-If is a durable financial record. If both prices are
    // known, the persisted target delta must exactly match the same
    // calculation returned by preview; otherwise a client could record a
    // fabricated saving that does not correspond to the proposed price.
    if (input.currentPriceMinor !== null && input.proposedPriceMinor !== null) {
      const expectedTargetDelta =
        BigInt(input.proposedPriceMinor) - BigInt(input.currentPriceMinor);
      if (target !== expectedTargetDelta) {
        throw new ConflictError(
          "Proposed target delta does not match the current and proposed prices",
        );
      }
    }

    const result = await budgetService.impact(propertyId, ownerId, {
      baseVersion: input.baseVersion,
      proposedLowDeltaMinor: input.proposedLowDeltaMinor,
      proposedTargetDeltaMinor: input.proposedTargetDeltaMinor,
      proposedHighDeltaMinor: input.proposedHighDeltaMinor,
      reason: input.reason,
      inputs: {
        ...input.inputs,
        scopeChange: input.scopeChange,
        roomId: input.roomId ?? null,
        currentPriceMinor: input.currentPriceMinor,
        proposedPriceMinor: input.proposedPriceMinor,
        designImpact: input.designImpact,
        functionImpact: input.functionImpact,
      },
    });

    // README §9's required ACCEPTED state: only created when this
    // commit genuinely represents a real cost reduction with both real
    // prices known - never for a cost increase or a price-unknown
    // commit, which are real, legitimate budget revisions but not
    // "accepted savings" in the README's own sense. The committed
    // target delta is already verified above to exactly match these
    // same two prices, so this never records a saving amount that
    // disagrees with the real, persisted BudgetImpact it references.
    if (
      input.currentPriceMinor !== null &&
      input.proposedPriceMinor !== null &&
      target < 0n
    ) {
      await savingRepository.create({
        propertyId,
        ownerId,
        budgetImpactId: result.id,
        currentPriceMinor: BigInt(input.currentPriceMinor),
        proposedPriceMinor: BigInt(input.proposedPriceMinor),
        savingMinor: -target,
        reason: input.reason,
      });
    }

    return result;
  },
};
