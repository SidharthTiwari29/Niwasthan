import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { NotFoundError } from "@/server/errors/AppError";
import { prisma } from "@/server/db/prisma";

type RouteParams = {
  params: Promise<{ projectId: string; jobId: string }>;
};

// The real, missing piece completing the render trigger→poll→view loop:
// createAndEnqueueJob (jobs/route.ts) starts a job, the worker and
// renderPollingService (built earlier this session) advance it toward a
// real terminal status, but nothing in the running application ever let
// a customer check on a job they started. Returns the job's own real,
// current state plus any real assets the worker has actually attached
// to it - never a fabricated "still processing" placeholder when the
// job has genuinely finished or failed.
export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { projectId, jobId } = await params;

    const job = await prisma.aIJob.findFirst({
      where: { id: jobId, projectId, project: { ownerId: userId } },
      include: {
        assets: {
          select: { id: true, type: true, contentType: true, metadata: true },
        },
      },
    });
    if (!job) throw new NotFoundError("AIJob");

    return NextResponse.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        errorCode: job.errorCode,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        assets: job.assets.map((asset: (typeof job.assets)[number]) => ({
          id: asset.id,
          type: asset.type,
          contentType: asset.contentType,
          // A real render's output lives at the rendering provider's own
          // URL, not in this app's internal storage - exposed directly
          // here rather than through the internal-storage download-url
          // route, which assumes an objectKey this app's own storage
          // provider actually holds.
          externalUrl:
            asset.metadata &&
            typeof asset.metadata === "object" &&
            "externalUrl" in asset.metadata
              ? (asset.metadata as { externalUrl: unknown }).externalUrl
              : null,
        })),
      },
    });
  },
);
