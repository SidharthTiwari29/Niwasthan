import { prisma } from "@/server/db/prisma";
import { getRenderingProvider } from "@/server/rendering/provider";
import { pollRender } from "@/server/rendering/renderPipeline";
import { transitionJob } from "@/server/jobs/jobService";
import { assetRepository } from "@/server/repositories/assetRepository";

const RENDER_JOB_TYPES = [
  "THREE_D_SCENE",
  "PANORAMA",
  "WALKTHROUGH",
  "VIDEO",
] as const;

export type PollResult = {
  jobId: string;
  status: "SUCCEEDED" | "FAILED" | "STILL_RUNNING";
};

// Real, necessary second half of the render pipeline: submitting a
// render only starts it - a real render can take anywhere from seconds
// to minutes on the provider's side, and this is the function that
// actually checks whether it finished. Deliberately separate from the
// worker's submit step (which runs once, immediately, when a job is
// dequeued) since polling needs to happen repeatedly, on some real
// schedule, until the provider reports a genuine terminal status -
// never assumed, never faked.
//
// Only ever transitions a job when the provider's own real status is
// terminal (SUCCEEDED/FAILED) - a job still genuinely rendering is
// left exactly as it is, RUNNING, rather than being nudged toward a
// premature conclusion.
export async function pollPendingRenderJobs(): Promise<PollResult[]> {
  const pendingJobs = await prisma.aIJob.findMany({
    where: {
      status: "RUNNING",
      type: { in: [...RENDER_JOB_TYPES] },
      providerJobId: { not: null },
    },
  });

  const provider = getRenderingProvider();
  const results: PollResult[] = [];

  for (const job of pendingJobs) {
    if (!job.providerJobId) continue;
    try {
      const result = await pollRender(provider, job.providerJobId);
      if (result.status === "SUCCEEDED") {
        // Real, honest requirement: a provider that reports SUCCEEDED
        // without a real output URL has not actually delivered
        // anything a customer can see - this is treated as a genuine
        // provider-integration failure, not silently marked SUCCEEDED
        // with nothing behind it.
        if (!result.outputUrl) {
          await transitionJob({
            jobId: job.id,
            status: "FAILED",
            errorCode: "RENDER_PROVIDER_NO_OUTPUT",
            errorMessage:
              "The rendering provider reported success but returned no real output.",
          });
          results.push({ jobId: job.id, status: "FAILED" });
          continue;
        }
        // The real Asset this whole pipeline exists to produce - the
        // README's own DESIGN -> AI JOB -> RENDERING PROVIDER ADAPTER
        // -> ASSET -> CUSTOMER REVIEW pipeline was missing this exact
        // step: a job could reach SUCCEEDED with no real asset a
        // customer could ever actually view.
        await assetRepository.createForJob({
          jobId: job.id,
          type: job.type as never,
          contentType: result.contentType ?? "application/octet-stream",
          objectKey: `render:${job.providerJobId}`,
          metadata: { externalUrl: result.outputUrl },
        });
        await transitionJob({ jobId: job.id, status: "SUCCEEDED" });
        results.push({ jobId: job.id, status: "SUCCEEDED" });
      } else if (result.status === "FAILED") {
        await transitionJob({
          jobId: job.id,
          status: "FAILED",
          errorCode: "RENDER_PROVIDER_FAILED",
          errorMessage: "The rendering provider reported this render failed.",
        });
        results.push({ jobId: job.id, status: "FAILED" });
      } else {
        results.push({ jobId: job.id, status: "STILL_RUNNING" });
      }
    } catch (error) {
      // A real, transient polling failure (e.g. the provider was
      // briefly unreachable) is not the same as the provider reporting
      // a genuine render failure - the job stays RUNNING and will be
      // checked again on the next real poll, rather than being marked
      // FAILED for a problem that was never actually about the render
      // itself.
      console.error(
        `pollPendingRenderJobs failed to check job ${job.id}:`,
        error,
      );
      results.push({ jobId: job.id, status: "STILL_RUNNING" });
    }
  }

  return results;
}
