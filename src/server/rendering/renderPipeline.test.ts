import { describe, expect, it } from "vitest";
import { pollRender, submitRender } from "./renderPipeline";
import type { RenderingProvider } from "./provider";

const provider: RenderingProvider = {
  async submit() {
    return { provider: "test", providerJobId: "provider-1" };
  },
  async getStatus() {
    return { status: "SUCCEEDED", outputUrl: "https://example.com/out.mp4" };
  },
};

describe("renderPipeline", () => {
  it("submits a valid render request and validates provider output", async () => {
    await expect(
      submitRender(provider, {
        jobId: "job-1",
        type: "DESIGN_IMAGE",
        input: { designVersionId: "design-1" },
      }),
    ).resolves.toEqual({ provider: "test", providerJobId: "provider-1" });
  });

  it("rejects missing job ids and provider ids", async () => {
    await expect(
      submitRender(provider, {
        jobId: " ",
        type: "DESIGN_IMAGE",
        input: {},
      }),
    ).rejects.toThrow("RENDER_JOB_ID_REQUIRED");

    const badProvider: RenderingProvider = {
      async submit() {
        return { provider: "", providerJobId: "x" };
      },
      async getStatus() {
        return { status: "QUEUED" as const };
      },
    };
    await expect(
      submitRender(badProvider, {
        jobId: "job-1",
        type: "DESIGN_IMAGE",
        input: {},
      }),
    ).rejects.toThrow("RENDER_PROVIDER_REQUIRED");
  });

  it("polls provider status with an explicit provider job id", async () => {
    await expect(pollRender(provider, "provider-1")).resolves.toEqual({
      status: "SUCCEEDED",
      outputUrl: "https://example.com/out.mp4",
    });
    await expect(pollRender(provider, " ")).rejects.toThrow(
      "PROVIDER_JOB_ID_REQUIRED",
    );
  });
});
