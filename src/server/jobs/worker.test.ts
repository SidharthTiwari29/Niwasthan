import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAIProvider } from "@/server/ai/provider";
import { getRenderingProvider } from "@/server/rendering/provider";
import { submitRender } from "@/server/rendering/renderPipeline";
import { transitionJob } from "./jobService";
import { processJob } from "./worker";

vi.mock("./jobService", () => ({
  transitionJob: vi.fn(),
}));

vi.mock("@/server/ai/provider", () => ({
  getAIProvider: vi.fn(),
}));

vi.mock("@/server/rendering/provider", () => ({
  getRenderingProvider: vi.fn(),
}));

vi.mock("@/server/rendering/renderPipeline", () => ({
  submitRender: vi.fn(),
}));

const mockTransitionJob = vi.mocked(transitionJob);
const mockGetAIProvider = vi.mocked(getAIProvider);
const mockGetRenderingProvider = vi.mocked(getRenderingProvider);
const mockSubmitRender = vi.mocked(submitRender);

function fakeJob(
  name: string,
  id = "job-1",
  data: Record<string, unknown> = {},
) {
  return { id, name, data } as never;
}

describe("processJob - render job types", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes a real THREE_D_SCENE job to the real rendering provider, never the AI provider", async () => {
    mockGetRenderingProvider.mockReturnValue({} as never);
    mockSubmitRender.mockResolvedValue({
      provider: "http",
      providerJobId: "render-job-1",
    });

    await processJob(fakeJob("THREE_D_SCENE"));

    expect(mockSubmitRender).toHaveBeenCalled();
    expect(mockGetAIProvider).not.toHaveBeenCalled();
  });

  it("keeps a real, successfully-submitted render job RUNNING rather than fabricating a SUCCEEDED state - rendering is genuinely asynchronous", async () => {
    mockGetRenderingProvider.mockReturnValue({} as never);
    mockSubmitRender.mockResolvedValue({
      provider: "http",
      providerJobId: "render-job-1",
    });

    await processJob(fakeJob("WALKTHROUGH"));

    expect(mockTransitionJob).toHaveBeenLastCalledWith({
      jobId: "job-1",
      status: "RUNNING",
      provider: "http",
      providerJobId: "render-job-1",
    });
  });

  it("real, correct routing for every render job type, not just one", async () => {
    mockGetRenderingProvider.mockReturnValue({} as never);
    mockSubmitRender.mockResolvedValue({
      provider: "http",
      providerJobId: "render-job-1",
    });

    for (const type of ["THREE_D_SCENE", "PANORAMA", "WALKTHROUGH", "VIDEO"]) {
      mockSubmitRender.mockClear();
      await processJob(fakeJob(type));
      expect(mockSubmitRender).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type }),
      );
    }
  });

  it("marks a genuinely failed render submission FAILED with a real, specific error code, and re-throws", async () => {
    mockGetRenderingProvider.mockReturnValue({} as never);
    mockSubmitRender.mockRejectedValue(
      new Error("RENDERING_PROVIDER_NOT_CONFIGURED"),
    );

    await expect(processJob(fakeJob("VIDEO"))).rejects.toThrow(
      "RENDERING_PROVIDER_NOT_CONFIGURED",
    );

    expect(mockTransitionJob).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "FAILED",
        errorCode: "RENDER_PROVIDER_ERROR",
      }),
    );
  });
});

describe("processJob - AI provider job types (unchanged real behavior)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("still routes a real DESIGN_GENERATION job to the AI provider, never the rendering provider", async () => {
    mockGetAIProvider.mockReturnValue({
      generateDesign: vi.fn().mockResolvedValue({
        providerJobId: "ai-job-1",
        output: { real: true },
      }),
    } as never);

    await processJob(fakeJob("DESIGN_GENERATION"));

    expect(mockGetAIProvider).toHaveBeenCalled();
    expect(mockSubmitRender).not.toHaveBeenCalled();
    expect(mockTransitionJob).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "SUCCEEDED" }),
    );
  });

  it("rejects a genuinely unsupported job type", async () => {
    await expect(processJob(fakeJob("SOME_UNKNOWN_TYPE"))).rejects.toThrow(
      "UNSUPPORTED_JOB_TYPE:SOME_UNKNOWN_TYPE",
    );
  });
});
