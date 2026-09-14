import { describe, expect, it } from "vitest";
import { submitRender } from "./renderPipeline";

describe("render pipeline validation", () => {
  it("rejects an empty provider job id", async () => {
    const provider = {
      submit: async () => ({ provider: "test", providerJobId: "" }),
      getStatus: async () => ({ status: "QUEUED" as const }),
    };
    await expect(
      submitRender(provider, { jobId: "job", type: "VIDEO", input: {} }),
    ).rejects.toThrow("PROVIDER_JOB_ID_REQUIRED");
  });
});
