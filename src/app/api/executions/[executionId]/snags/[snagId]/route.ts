import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { executionEvidenceService } from "@/server/services/executionEvidenceService";

const paramsSchema = z.object({
  executionId: z.string().cuid(),
  snagId: z.string().cuid(),
});
const bodySchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "ACCEPTED"]),
});
type RouteParams = { params: Promise<{ executionId: string; snagId: string }> };

export const PATCH = withErrorHandling(
  async (request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { snagId } = paramsSchema.parse(await params);
    const { status } = bodySchema.parse(await request.json());
    return NextResponse.json({
      snag: await executionEvidenceService.updateSnag(snagId, userId, status),
    });
  },
);
