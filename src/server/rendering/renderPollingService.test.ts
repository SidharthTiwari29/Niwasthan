import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { getRenderingProvider } from "@/server/rendering/provider";
import { pollRender } from "@/server/rendering/renderPipeline";
import { transitionJob } from "@/server/jobs/jobService";
import { pollPendingRenderJobs } from "./renderPollingService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    aIJob: { findMany: vi.fn() },
  },
}));

vi.mock("@/server/rendering/provider", () => ({
  getRenderingProvider: vi.fn(),
}));

vi.mock("@/server/rendering/renderPipeline", () => ({
  pollRender: vi.fn(),
}));

vi.mock("@/server/jobs/jobService", () => ({
  transitionJob: vi.fn(),
}));

const db = vi.mocked(prisma, { deep: true });
const mockGetRenderingProvider = vi.mocked(getRenderingProvider);
const mockPollRender = vi.mocked(pollRender);
const mockTransitionJob = vi.mocked(transitionJob);

describe("pollPendingRenderJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRenderingProvider.mockReturnValue({} as never);
  });

  it("only queries real, currently RUNNING render-type jobs with a real provider job ID already set", async () => {
    db.aIJob.findMany.mockResolvedValue([]);

    await pollPendingRenderJobs();

    expect(db.aIJob.findMany).toHaveBeenCalledWith({
      where: {
        status: "RUNNING",
        type: { in: ["THREE_D_SCENE", "PANORAMA", "WALKTHROUGH", "VIDEO"] },
        providerJobId: { not: null },
      },
    });
  });

  it("transitions a real, genuinely SUCCEEDED render to its correct terminal state", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1" },
    ] as never);
    mockPollRender.mockResolvedValue("SUCCEEDED");

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).toHaveBeenCalledWith({
      jobId: "job-1",
      status: "SUCCEEDED",
    });
    expect(result).toEqual([{ jobId: "job-1", status: "SUCCEEDED" }]);
  });

  it("transitions a real, genuinely FAILED render with a real, specific error", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1" },
    ] as never);
    mockPollRender.mockResolvedValue("FAILED");

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-1",
        status: "FAILED",
        errorCode: "RENDER_PROVIDER_FAILED",
      }),
    );
    expect(result).toEqual([{ jobId: "job-1", status: "FAILED" }]);
  });

  it("leaves a real, still-genuinely-rendering job exactly as it is - never nudges it toward a premature conclusion", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1" },
    ] as never);
    mockPollRender.mockResolvedValue("RUNNING");

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).not.toHaveBeenCalled();
    expect(result).toEqual([{ jobId: "job-1", status: "STILL_RUNNING" }]);
  });

  it("treats a real, transient polling failure as still-running rather than a genuine render failure", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1" },
    ] as never);
    mockPollRender.mockRejectedValue(new Error("network blip"));

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).not.toHaveBeenCalled();
    expect(result).toEqual([{ jobId: "job-1", status: "STILL_RUNNING" }]);
  });

  it("polls every real pending job independently, not just the first one", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1" },
      { id: "job-2", providerJobId: "render-2" },
    ] as never);
    mockPollRender
      .mockResolvedValueOnce("SUCCEEDED")
      .mockResolvedValueOnce("FAILED");

    const result = await pollPendingRenderJobs();

    expect(result).toEqual([
      { jobId: "job-1", status: "SUCCEEDED" },
      { jobId: "job-2", status: "FAILED" },
    ]);
  });
});
