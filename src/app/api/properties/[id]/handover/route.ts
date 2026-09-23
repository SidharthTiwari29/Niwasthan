import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { executionEvidenceService } from "@/server/services/executionEvidenceService";

const paramsSchema = z.object({ id: z.string().cuid() });
const bodySchema = z.object({ executionId: z.string().cuid(), status: z.enum(["READY_FOR_REVIEW", "ACCEPTED", "REOPENED"]), notes: z.string().trim().max(4000).optional() });
type RouteParams = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { id } = paramsSchema.parse(await params);
  return NextResponse.json({ handover: await executionEvidenceService.getHandover(id, userId) });
});

export const POST = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { id } = paramsSchema.parse(await params);
  const input = bodySchema.parse(await request.json());
  return NextResponse.json({ handover: await executionEvidenceService.createOrReviewHandover(id, input.executionId, userId, input.status, input.notes) });
});
