import { describe, expect, it } from "vitest";
import { pollRender, submitRender } from "./renderPipeline";

describe("render pipeline integration contract", () => {
  it("propagates provider status", async () => {
    const provider = {
      submit: async () => ({ provider: "test", providerJobId: "p-1" }),
      getStatus: async () => ({ status: "RUNNING" as const }),
    };
    await expect(pollRender(provider, "p-1")).resolves.toEqual({
      status: "RUNNING",
    });
  });

  it("propagates provider submission failures", async () => {
    const provider = {
      submit: async () => {
        throw new Error("PROVIDER_UNAVAILABLE");
      },
      getStatus: async () => ({ status: "FAILED" as const }),
    };
    await expect(
      submitRender(provider, {
        jobId: "job-1",
        type: "DESIGN_IMAGE",
        input: {},
      }),
    ).rejects.toThrow("PROVIDER_UNAVAILABLE");
  });
});
