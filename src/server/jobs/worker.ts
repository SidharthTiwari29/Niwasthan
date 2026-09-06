import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { getAIProvider, type AIRequest } from "@/server/ai/provider";
import {
  getRenderingProvider,
  type RenderType,
} from "@/server/rendering/provider";
import { submitRender } from "@/server/rendering/renderPipeline";
import { transitionJob } from "./jobService";
import { NivasaJobQueue } from "./queue";

type WorkerPayload = Record<string, unknown>;

function providerMethod(type: string) {
  switch (type) {
    case "ROOM_UNDERSTANDING":
      return "analyzeFloorPlan" as const;
    case "DESIGN_GENERATION":
      return "generateDesign" as const;
    case "DESIGN_REVISION":
      return "reviseDesign" as const;
    case "BOQ_GENERATION":
      return "assistBoq" as const;
    default:
      return null;
  }
}

// Real, actual rendering job types - genuinely distinct from the AI
// provider jobs below. WALKTHROUGH was previously (incorrectly) routed
// through the AI provider's createWalkthroughPrompt, which only ever
// generates a text prompt describing a walkthrough, never an actual
// render - and THREE_D_SCENE/PANORAMA/VIDEO had no handler at all,
// meaning any real job of those types would have crashed with
// UNSUPPORTED_JOB_TYPE the moment one was ever queued. This is the
// real, missing connection between the already-built RenderingProvider
// abstraction (src/server/rendering/provider.ts) and the job system
// that actually runs work.
const RENDER_JOB_TYPES: readonly string[] = [
  "THREE_D_SCENE",
  "PANORAMA",
  "WALKTHROUGH",
  "VIDEO",
];

// Real, separately-exported processor - extracted from the BullMQ
// Worker constructor call specifically so it can be tested directly,
// without needing a real or mocked Redis connection just to exercise
// this function's actual routing and error-handling logic.
export async function processJob(job: Job<WorkerPayload>) {
  if (RENDER_JOB_TYPES.includes(job.name)) {
    await transitionJob({ jobId: String(job.id), status: "RUNNING" });
    try {
      const provider = getRenderingProvider();
      const submission = await submitRender(provider, {
        jobId: String(job.id),
        type: job.name as RenderType,
        input: job.data,
      });
      // A real render submission only confirms the provider has
      // accepted the work, not that it's finished - rendering is
      // genuinely asynchronous. This job stays RUNNING, with the real
      // provider job ID recorded, until a separate real polling pass
      // (renderPollingService) observes the provider's own terminal
      // status and transitions it from there. Marking this SUCCEEDED
      // here would be exactly the kind of fabricated completion this
      // system exists to avoid.
      await transitionJob({
        jobId: String(job.id),
        status: "RUNNING",
        provider: submission.provider,
        providerJobId: submission.providerJobId,
      });
      return submission;
    } catch (error) {
      await transitionJob({
        jobId: String(job.id),
        status: "FAILED",
        errorCode: "RENDER_PROVIDER_ERROR",
        errorMessage:
          error instanceof Error ? error.message : "Render provider failed",
      });
      throw error;
    }
  }

  const method = providerMethod(job.name);
  if (!method) throw new Error(`UNSUPPORTED_JOB_TYPE:${job.name}`);
  await transitionJob({ jobId: String(job.id), status: "RUNNING" });
  try {
    const provider = getAIProvider();
    const request: AIRequest = {
      jobId: String(job.id),
      type:
        method === "assistBoq"
          ? "BOQ_ASSISTANCE"
          : (job.name as AIRequest["type"]),
      input: job.data,
    };
    const result = await provider[method](request);
    await transitionJob({
      jobId: String(job.id),
      status: "SUCCEEDED",
      provider: process.env.AI_PROVIDER,
      providerJobId: result.providerJobId,
      output: result.output,
    });
    return result.output;
  } catch (error) {
    await transitionJob({
      jobId: String(job.id),
      status: "FAILED",
      errorCode: "PROVIDER_ERROR",
      errorMessage: error instanceof Error ? error.message : "Provider failed",
    });
    throw error;
  }
}

export function createNivasaWorker() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_NOT_CONFIGURED");
  return new Worker(NivasaJobQueue, processJob, {
    connection: new IORedis(url, { maxRetriesPerRequest: null }),
    concurrency: Number(process.env.JOB_CONCURRENCY ?? 4),
  });
}
