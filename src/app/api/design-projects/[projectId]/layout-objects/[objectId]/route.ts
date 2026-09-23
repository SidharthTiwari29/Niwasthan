import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { designLayoutObjectService } from "@/server/services/designLayoutObjectService";

const paramsSchema = z.object({
  projectId: z.string().cuid(),
  objectId: z.string().cuid(),
});
type RouteParams = { params: Promise<{ projectId: string; objectId: string }> };

export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { projectId, objectId } = parseOrThrow(paramsSchema, await params);
  await designLayoutObjectService.remove(projectId, objectId, userId);
  return NextResponse.json({ success: true });
});

const positionSchema = z.object({
  xMm: z.number().int().nonnegative(),
  yMm: z.number().int().nonnegative(),
});

export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const { userId } = await requireAuth();
  const { projectId, objectId } = parseOrThrow(paramsSchema, await params);
  const input = parseOrThrow(positionSchema, await request.json());
  const object = await designLayoutObjectService.update(projectId, objectId, userId, input);
  return NextResponse.json({ object });
});
