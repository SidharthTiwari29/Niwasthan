import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { designLayoutObjectService } from "@/server/services/designLayoutObjectService";

const paramsSchema = z.object({ projectId: z.string().cuid() });
const objectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  xMm: z.number().int().min(0).max(100_000),
  yMm: z.number().int().min(0).max(100_000),
  widthMm: z.number().int().positive().max(100_000),
  depthMm: z.number().int().positive().max(100_000),
});
type RouteParams = { params: Promise<{ projectId: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { projectId } = parseOrThrow(paramsSchema, await params);
  const objects = await designLayoutObjectService.list(projectId, userId);
  return NextResponse.json({ objects });
});

export const POST = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { projectId } = parseOrThrow(paramsSchema, await params);
  const input = parseOrThrow(objectSchema, await request.json());
  const object = await designLayoutObjectService.create(projectId, userId, input);
  return NextResponse.json({ object }, { status: 201 });
});
