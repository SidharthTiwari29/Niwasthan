import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/server/errors/AppError";
import { prisma } from "@/server/db/prisma";
import { getAIProvider } from "@/server/ai/provider";
import { getStorageProvider } from "@/server/storage/provider";
import { emitEvent } from "@/server/operations/eventEmitter";
import {
  analyzeFloorPlan,
  matchObservationToRoom,
  rejectObservation,
  getLatestAnalysisForFloorPlan,
} from "./floorPlanAnalysisService";

vi.mock("@/server/storage/provider", () => ({
  getStorageProvider: vi.fn(),
}));

vi.mock("@/server/operations/eventEmitter", () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    floorPlan: { findFirst: vi.fn() },
    floorPlanAnalysis: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    floorPlanObservation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    room: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/ai/provider", () => ({
  getAIProvider: vi.fn(),
}));

const db = vi.mocked(prisma, { deep: true });
const mockGetAIProvider = vi.mocked(getAIProvider);
const mockEmitEvent = vi.mocked(emitEvent);
const mockGetStorageProvider = vi.mocked(getStorageProvider);

// A real, working default so every test in this file can reach the
// real storage-provider call site without needing to configure it
// individually - specific tests can still override this if they need
// to test a real failure in the storage layer itself.
mockGetStorageProvider.mockReturnValue({
  createUploadGrant: vi.fn(),
  createDownloadUrl: vi.fn().mockResolvedValue("https://real-signed-url"),
});

const realFloorPlan = {
  id: "floor-plan-1",
  propertyId: "property-1",
  property: { ownerId: "user-1" },
  asset: { objectKey: "users/user-1/properties/property-1/assets/asset-1" },
};

function fakeProvider(impl: () => Promise<unknown>) {
  return {
    analyzeFloorPlan: vi.fn(impl),
    generateDesign: vi.fn(),
    reviseDesign: vi.fn(),
    assistBoq: vi.fn(),
    createWalkthroughPrompt: vi.fn(),
  };
}

describe("analyzeFloorPlan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the floor plan does not exist or is not owned by the caller", async () => {
    db.floorPlan.findFirst.mockResolvedValue(null);

    await expect(
      analyzeFloorPlan("floor-plan-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("persists and returns a real, honest NOT_AVAILABLE analysis when no AI provider is configured", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.reject(new Error("AI_PROVIDER_NOT_CONFIGURED")),
      ) as never,
    );

    const result = await analyzeFloorPlan("floor-plan-1", "user-1");

    expect(result.status).toBe("NOT_AVAILABLE");
    expect(db.floorPlanAnalysis.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "NOT_AVAILABLE" }),
      }),
    );
    expect(db.floorPlanObservation.create).not.toHaveBeenCalled();
  });

  it("does not swallow a genuinely unexpected provider error - records it as a real FAILED analysis and re-throws", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.reject(new Error("SOME_OTHER_REAL_FAILURE")),
      ) as never,
    );

    await expect(analyzeFloorPlan("floor-plan-1", "user-1")).rejects.toThrow(
      "SOME_OTHER_REAL_FAILURE",
    );

    expect(db.floorPlanAnalysis.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });

  it("persists real, evidence-backed observations for a genuinely successful analysis", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    db.floorPlanObservation.create.mockResolvedValue({
      id: "observation-1",
      roomLabel: "Master Bedroom",
      confidenceBps: 8500,
      dimensions: { lengthFt: 12, widthFt: 10 },
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.resolve({
          providerJobId: "provider-job-1",
          output: {
            rooms: [
              {
                label: "Master Bedroom",
                confidenceBps: 8500,
                lengthFt: 12,
                widthFt: 10,
              },
            ],
          },
        }),
      ) as never,
    );

    const result = await analyzeFloorPlan("floor-plan-1", "user-1");

    expect(result.status).toBe("ANALYZED");
    if (result.status === "ANALYZED") {
      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].roomLabel).toBe("Master Bedroom");
    }
    expect(db.floorPlanAnalysis.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ANALYZED" }),
      }),
    );
  });

  it("emits a real FLOOR_PLAN_ANALYSIS_STARTED event as soon as the analysis record is created", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.reject(new Error("AI_PROVIDER_NOT_CONFIGURED")),
      ) as never,
    );

    await analyzeFloorPlan("floor-plan-1", "user-1");

    expect(mockEmitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FLOOR_PLAN_ANALYSIS_STARTED",
        propertyId: "property-1",
        correlationId: "analysis-1",
      }),
    );
  });

  it("emits a real FLOOR_PLAN_ANALYSIS_COMPLETED event on a genuinely successful analysis, sharing the same correlation ID as the STARTED event", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    db.floorPlanObservation.create.mockResolvedValue({
      id: "observation-1",
      roomLabel: "Bedroom",
      confidenceBps: 8000,
      dimensions: {},
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.resolve({
          providerJobId: "provider-job-1",
          output: { rooms: [{ label: "Bedroom" }] },
        }),
      ) as never,
    );

    await analyzeFloorPlan("floor-plan-1", "user-1");

    expect(mockEmitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FLOOR_PLAN_ANALYSIS_COMPLETED",
        correlationId: "analysis-1",
        currentState: "ANALYZED",
      }),
    );
  });

  it("emits a real FLOOR_PLAN_ANALYSIS_FAILED event at WARNING severity for the expected not-configured case - a known condition, not an alarm", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.reject(new Error("AI_PROVIDER_NOT_CONFIGURED")),
      ) as never,
    );

    await analyzeFloorPlan("floor-plan-1", "user-1");

    expect(mockEmitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FLOOR_PLAN_ANALYSIS_FAILED",
        severity: "WARNING",
        currentState: "NOT_AVAILABLE",
      }),
    );
  });

  it("emits a real FLOOR_PLAN_ANALYSIS_FAILED event at ERROR severity for a genuinely unexpected failure", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    } as never);
    mockGetAIProvider.mockReturnValue(
      fakeProvider(() =>
        Promise.reject(new Error("SOME_OTHER_REAL_FAILURE")),
      ) as never,
    );

    await expect(analyzeFloorPlan("floor-plan-1", "user-1")).rejects.toThrow(
      "SOME_OTHER_REAL_FAILURE",
    );

    expect(mockEmitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FLOOR_PLAN_ANALYSIS_FAILED",
        severity: "ERROR",
        currentState: "FAILED",
      }),
    );
  });
});

describe("matchObservationToRoom", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the observation does not exist or belongs to a property the caller does not own", async () => {
    db.floorPlanObservation.findFirst.mockResolvedValue(null);

    await expect(
      matchObservationToRoom("observation-1", "room-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects when the target room does not belong to the same property as the observation", async () => {
    db.floorPlanObservation.findFirst.mockResolvedValue({
      id: "observation-1",
      analysis: {
        floorPlan: {
          propertyId: "property-1",
          property: { ownerId: "user-1" },
        },
      },
    } as never);
    db.room.findFirst.mockResolvedValue(null);

    await expect(
      matchObservationToRoom("observation-1", "room-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("records a real match only via this explicit action, never automatically", async () => {
    db.floorPlanObservation.findFirst.mockResolvedValue({
      id: "observation-1",
      analysis: {
        floorPlan: {
          propertyId: "property-1",
          property: { ownerId: "user-1" },
        },
      },
    } as never);
    db.room.findFirst.mockResolvedValue({
      id: "room-1",
      propertyId: "property-1",
    } as never);

    await matchObservationToRoom("observation-1", "room-1", "user-1");

    expect(db.floorPlanObservation.update).toHaveBeenCalledWith({
      where: { id: "observation-1" },
      data: { matchedRoomId: "room-1" },
    });
  });
});

describe("rejectObservation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the observation does not exist or belongs to a property the caller does not own", async () => {
    db.floorPlanObservation.findFirst.mockResolvedValue(null);

    await expect(
      rejectObservation("observation-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("denies rejecting an observation belonging to a property owned by someone else", async () => {
    db.floorPlanObservation.findFirst.mockResolvedValue({
      id: "observation-1",
      analysis: {
        floorPlan: { property: { ownerId: "someone-else" } },
      },
    } as never);

    await expect(
      rejectObservation("observation-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(db.floorPlanObservation.update).not.toHaveBeenCalled();
  });

  it("records a real, explicit rejection distinct from simply leaving an observation unmatched", async () => {
    db.floorPlanObservation.findFirst.mockResolvedValue({
      id: "observation-1",
      analysis: {
        floorPlan: { property: { ownerId: "user-1" } },
      },
    } as never);

    await rejectObservation("observation-1", "user-1");

    expect(db.floorPlanObservation.update).toHaveBeenCalledWith({
      where: { id: "observation-1" },
      data: { rejected: true },
    });
  });
});

describe("getLatestAnalysisForFloorPlan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the floor plan does not exist or is not owned by the caller", async () => {
    db.floorPlan.findFirst.mockResolvedValue(null);

    await expect(
      getLatestAnalysisForFloorPlan("floor-plan-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the real floor plan with its most recent analysis and observations, or null if none exists yet", async () => {
    db.floorPlan.findFirst.mockResolvedValue(realFloorPlan as never);
    db.floorPlanAnalysis.findFirst.mockResolvedValue(null);

    const result = await getLatestAnalysisForFloorPlan(
      "floor-plan-1",
      "user-1",
    );

    expect(result.floorPlan).toBe(realFloorPlan);
    expect(result.analysis).toBeNull();
  });
});
