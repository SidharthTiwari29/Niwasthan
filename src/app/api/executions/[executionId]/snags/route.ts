import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { executionEvidenceService } from "@/server/services/executionEvidenceService";

const paramsSchema = z.object({ executionId: z.string().cuid() });
const bodySchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(4000), evidenceAssetIds: z.array(z.string().cuid()).max(10).default([]) });
type RouteParams = { params: Promise<{ executionId: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { executionId } = paramsSchema.parse(await params);
  return NextResponse.json({ snags: await executionEvidenceService.listSnags(executionId, userId) });
});

export const POST = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { executionId } = paramsSchema.parse(await params);
  const input = bodySchema.parse(await request.json());
  const snag = await executionEvidenceService.createSnag(executionId, userId, input.title, input.description, input.evidenceAssetIds);
  return NextResponse.json({ snag }, { status: 201 });
});
