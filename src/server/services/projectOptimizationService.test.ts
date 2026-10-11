import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/repositories/budgetRepository", () => ({
  budgetRepository: { findPlan: vi.fn() },
}));

import { budgetRepository } from "@/server/repositories/budgetRepository";
import { projectOptimizationService } from "./projectOptimizationService";

const mockedFindPlan = vi.mocked(budgetRepository.findPlan);

describe("projectOptimizationService.optimize", () => {
  it("returns null when the property has no budget plan yet", async () => {
    mockedFindPlan.mockResolvedValueOnce(null);
    const result = await projectOptimizationService.optimize("prop1", "user1");
    expect(result).toBeNull();
  });

  it("recommends shifting budget from a room near its low to a room near its high, bounded by both ranges", async () => {
    mockedFindPlan.mockResolvedValueOnce({
      plan: { id: "plan1" } as never,
      versions: [
        {
          id: "v1",
          version: 1,
          totalLowMinor: 180_000n,
          totalTargetMinor: 200_000n,
          totalHighMinor: 240_000n,
          lines: [
            // "Budget utility" room: target sits right at its low -
            // all headroom, nothing to absorb further.
            {
              roomId: "utility",
              lowMinor: 50_000n,
              targetMinor: 50_000n,
              highMinor: 60_000n,
            },
            // "Premium kitchen" room: target sits right at its high -
            // no headroom, wants to absorb more.
            {
              roomId: "kitchen",
              lowMinor: 100_000n,
              targetMinor: 130_000n,
              highMinor: 130_000n,
            },
            // A neutral room sitting exactly mid-range - neither a
            // giver nor an obvious receiver.
            {
              roomId: "bedroom",
              lowMinor: 30_000n,
              targetMinor: 40_000n,
              highMinor: 50_000n,
            },
          ],
        },
      ],
    } as never);

    const result = await projectOptimizationService.optimize("prop1", "user1");
    expect(result).not.toBeNull();
    expect(result!.rooms).toHaveLength(3);

    const utility = result!.rooms.find((r) => r.roomId === "utility")!;
    expect(utility.headroomMinor).toBe(0n);
    expect(utility.stretchMinor).toBe(10_000n);

    const kitchen = result!.rooms.find((r) => r.roomId === "kitchen")!;
    expect(kitchen.headroomMinor).toBe(30_000n);
    expect(kitchen.stretchMinor).toBe(0n);

    // kitchen has real headroom (30k) and bedroom has real stretch
    // capacity (10k) - the recommendation must be bounded by the
    // smaller of the two, never exceed either room's own estimated range.
    const rec = result!.recommendations.find(
      (r) => r.fromRoomId === "kitchen" && r.toRoomId === "bedroom",
    );
    expect(rec).toBeDefined();
    expect(rec!.shiftMinor).toBe(10_000n);

    // The total project envelope is untouched by any recommendation -
    // this is a reallocation, never an invented increase in total cost.
    expect(result!.totalLowMinor).toBe(180_000n);
    expect(result!.totalHighMinor).toBe(240_000n);
  });

  it("produces no recommendations when every room is already at its target with no headroom or stretch", async () => {
    mockedFindPlan.mockResolvedValueOnce({
      plan: { id: "plan1" } as never,
      versions: [
        {
          id: "v1",
          version: 1,
          totalLowMinor: 100_000n,
          totalTargetMinor: 100_000n,
          totalHighMinor: 100_000n,
          lines: [
            {
              roomId: "living",
              lowMinor: 100_000n,
              targetMinor: 100_000n,
              highMinor: 100_000n,
            },
          ],
        },
      ],
    } as never);

    const result = await projectOptimizationService.optimize("prop1", "user1");
    expect(result!.recommendations).toHaveLength(0);
  });
});
