import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { getRenderingProvider } from "@/server/rendering/provider";
import { pollRender } from "@/server/rendering/renderPipeline";
import { transitionJob } from "@/server/jobs/jobService";
import { assetRepository } from "@/server/repositories/assetRepository";
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

vi.mock("@/server/repositories/assetRepository", () => ({
  assetRepository: { createForJob: vi.fn() },
}));

const db = vi.mocked(prisma, { deep: true });
const mockGetRenderingProvider = vi.mocked(getRenderingProvider);
const mockPollRender = vi.mocked(pollRender);
const mockTransitionJob = vi.mocked(transitionJob);
const mockCreateForJob = vi.mocked(assetRepository.createForJob);

describe("pollPendingRenderJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRenderingProvider.mockReturnValue({} as never);
    mockCreateForJob.mockResolvedValue({} as never);
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

  it("transitions a real, genuinely SUCCEEDED render (with a real output URL) to its correct terminal state", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
    ] as never);
    mockPollRender.mockResolvedValue({
      status: "SUCCEEDED",
      outputUrl: "https://provider.example.com/render-1.mp4",
      contentType: "video/mp4",
    });

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).toHaveBeenCalledWith({
      jobId: "job-1",
      status: "SUCCEEDED",
    });
    expect(result).toEqual([{ jobId: "job-1", status: "SUCCEEDED" }]);
  });

  it("creates the real Asset the whole pipeline exists to produce, with the real provider URL in its metadata", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
    ] as never);
    mockPollRender.mockResolvedValue({
      status: "SUCCEEDED",
      outputUrl: "https://provider.example.com/render-1.mp4",
      contentType: "video/mp4",
    });

    await pollPendingRenderJobs();

    expect(mockCreateForJob).toHaveBeenCalledWith({
      jobId: "job-1",
      type: "WALKTHROUGH",
      contentType: "video/mp4",
      objectKey: "render:render-1",
      metadata: { externalUrl: "https://provider.example.com/render-1.mp4" },
    });
  });

  it("never fabricates success when the provider reports SUCCEEDED but returns no real output - treated as a genuine failure instead", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
    ] as never);
    mockPollRender.mockResolvedValue({ status: "SUCCEEDED" });

    const result = await pollPendingRenderJobs();

    expect(mockCreateForJob).not.toHaveBeenCalled();
    expect(mockTransitionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-1",
        status: "FAILED",
        errorCode: "RENDER_PROVIDER_NO_OUTPUT",
      }),
    );
    expect(result).toEqual([{ jobId: "job-1", status: "FAILED" }]);
  });

  it("transitions a real, genuinely FAILED render with a real, specific error", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
    ] as never);
    mockPollRender.mockResolvedValue({ status: "FAILED" });

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
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
    ] as never);
    mockPollRender.mockResolvedValue({ status: "RUNNING" });

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).not.toHaveBeenCalled();
    expect(result).toEqual([{ jobId: "job-1", status: "STILL_RUNNING" }]);
  });

  it("treats a real, transient polling failure as still-running rather than a genuine render failure", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
    ] as never);
    mockPollRender.mockRejectedValue(new Error("network blip"));

    const result = await pollPendingRenderJobs();

    expect(mockTransitionJob).not.toHaveBeenCalled();
    expect(result).toEqual([{ jobId: "job-1", status: "STILL_RUNNING" }]);
  });

  it("polls every real pending job independently, not just the first one", async () => {
    db.aIJob.findMany.mockResolvedValue([
      { id: "job-1", providerJobId: "render-1", type: "WALKTHROUGH" },
      { id: "job-2", providerJobId: "render-2", type: "VIDEO" },
    ] as never);
    mockPollRender
      .mockResolvedValueOnce({
        status: "SUCCEEDED",
        outputUrl: "https://provider.example.com/render-1.mp4",
        contentType: "video/mp4",
      })
      .mockResolvedValueOnce({ status: "FAILED" });

    const result = await pollPendingRenderJobs();

    expect(result).toEqual([
      { jobId: "job-1", status: "SUCCEEDED" },
      { jobId: "job-2", status: "FAILED" },
    ]);
  });
});
