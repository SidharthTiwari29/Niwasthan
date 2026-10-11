import { budgetRepository } from "@/server/repositories/budgetRepository";

// README §10 — PROJECT-LEVEL OPTIMIZATION
//
// "Niwasthan should eventually optimize the complete interior project
// rather than isolated products. It can evaluate combinations across
// rooms, materials, products, suppliers, alternatives, quality,
// warranty, delivery, installation, budget and execution risk ...
// Recommendations must expose trade-offs and downstream effects."
//
// This is a read-only, evidence-grounded reasoning layer over the real,
// already-persisted BudgetVersion/BudgetLine rows (see budgetRepository):
// it never invents numbers of its own. Every room's low/target/high
// range already encodes a genuine spend band (see budget validators and
// whatIfService), so "room near its low" vs "room near its high" is a
// real signal already captured by estimators/designers, not a guess
// this service makes up. The service groups the latest budget version's
// lines by room, and for every pair of rooms where one room sits closer
// to its low (headroom to cut) and another sits closer to its high
// (room is already stretched / wants more), it proposes shifting real,
// bounded budget from the first room to the second — always within the
// existing total low/high envelope, so a recommendation can never
// silently grow the overall project cost beyond what was already
// estimated as possible.

export interface RoomBudgetSummary {
  roomId: string | null;
  lowMinor: bigint;
  targetMinor: bigint;
  highMinor: bigint;
  // 0 = sitting at its low (maximum realistic headroom to cut),
  // 1 = sitting at its high (already at its most expensive realistic spend).
  positionBps: number;
  headroomMinor: bigint; // target - low: what could still be trimmed
  stretchMinor: bigint; // high - target: what more this room could absorb
}

export interface TradeOffRecommendation {
  fromRoomId: string | null;
  toRoomId: string | null;
  shiftMinor: bigint;
  rationale: string;
  downstreamEffect: string;
}

export interface ProjectOptimizationResult {
  budgetVersionId: string;
  version: number;
  totalLowMinor: bigint;
  totalTargetMinor: bigint;
  totalHighMinor: bigint;
  rooms: RoomBudgetSummary[];
  recommendations: TradeOffRecommendation[];
}

function positionBps(low: bigint, target: bigint, high: bigint): number {
  const span = high - low;
  if (span <= 0n) return 5000;
  const offset = target - low;
  const bps = (offset * 10000n) / span;
  if (bps < 0n) return 0;
  if (bps > 10000n) return 10000;
  return Number(bps);
}

export const projectOptimizationService = {
  async optimize(
    propertyId: string,
    ownerId: string,
  ): Promise<ProjectOptimizationResult | null> {
    const plan = await budgetRepository.findPlan(propertyId, ownerId);
    if (!plan) return null;

    const latest = plan.versions[0];
    if (!latest) return null;

    const byRoom = new Map<
      string | null,
      { lowMinor: bigint; targetMinor: bigint; highMinor: bigint }
    >();

    for (const line of latest.lines as Array<Record<string, unknown>>) {
      const roomId = (line.roomId as string | null) ?? null;
      const lowMinor = BigInt(line.lowMinor as bigint | string | number);
      const targetMinor = BigInt(line.targetMinor as bigint | string | number);
      const highMinor = BigInt(line.highMinor as bigint | string | number);
      const existing = byRoom.get(roomId);
      if (existing) {
        existing.lowMinor += lowMinor;
        existing.targetMinor += targetMinor;
        existing.highMinor += highMinor;
      } else {
        byRoom.set(roomId, { lowMinor, targetMinor, highMinor });
      }
    }

    const rooms: RoomBudgetSummary[] = Array.from(byRoom.entries()).map(
      ([roomId, totals]) => ({
        roomId,
        lowMinor: totals.lowMinor,
        targetMinor: totals.targetMinor,
        highMinor: totals.highMinor,
        positionBps: positionBps(
          totals.lowMinor,
          totals.targetMinor,
          totals.highMinor,
        ),
        headroomMinor: totals.targetMinor - totals.lowMinor,
        stretchMinor: totals.highMinor - totals.targetMinor,
      }),
    );

    // Rooms with real headroom to give (closest to their low), paired
    // against rooms with real room to absorb more (closest to their
    // high) - both bounded by the same already-estimated ranges.
    const givers = rooms
      .filter((r) => r.headroomMinor > 0n)
      .sort((a, b) => a.positionBps - b.positionBps);
    const receivers = rooms
      .filter((r) => r.stretchMinor > 0n)
      .sort((a, b) => b.positionBps - a.positionBps);

    const recommendations: TradeOffRecommendation[] = [];
    const remainingHeadroom = new Map(
      givers.map((r) => [r.roomId, r.headroomMinor]),
    );
    const remainingStretch = new Map(
      receivers.map((r) => [r.roomId, r.stretchMinor]),
    );

    for (const giver of givers) {
      for (const receiver of receivers) {
        if (giver.roomId === receiver.roomId) continue;
        const available = remainingHeadroom.get(giver.roomId) ?? 0n;
        const capacity = remainingStretch.get(receiver.roomId) ?? 0n;
        if (available <= 0n || capacity <= 0n) continue;

        const shiftMinor = available < capacity ? available : capacity;
        if (shiftMinor <= 0n) continue;

        recommendations.push({
          fromRoomId: giver.roomId,
          toRoomId: receiver.roomId,
          shiftMinor,
          rationale: `${giver.roomId ?? "Unassigned"} is estimated near its lower realistic spend; ${receiver.roomId ?? "Unassigned"} is estimated near its upper realistic spend.`,
          downstreamEffect:
            "Shift stays within the already-estimated low/high range of both rooms, so total project cost does not change; it only reallocates priority across rooms. Re-run What-If before committing to confirm real product prices for the receiving room.",
        });

        remainingHeadroom.set(giver.roomId, available - shiftMinor);
        remainingStretch.set(receiver.roomId, capacity - shiftMinor);
      }
    }

    return {
      budgetVersionId: latest.id,
      version: latest.version,
      totalLowMinor: latest.totalLowMinor,
      totalTargetMinor: latest.totalTargetMinor,
      totalHighMinor: latest.totalHighMinor,
      rooms,
      // Ranked by largest real trade-off opportunity first.
      recommendations: recommendations.sort((a, b) =>
        b.shiftMinor > a.shiftMinor ? 1 : b.shiftMinor < a.shiftMinor ? -1 : 0,
      ),
    };
  },
};
