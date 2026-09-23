import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { uploadSessionService } from "@/server/services/uploadSessionService";

type RouteParams = { params: Promise<{ sessionId: string }> };
const idSchema = z.object({ sessionId: z.string().cuid() });
const rangeSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
  })
  .refine(
    (value) => value.end >= value.start,
    "end must be greater than or equal to start",
  );
const completeSchema = z.object({
  action: z.literal("complete"),
  clientChecksum: z.string().trim().max(128).optional(),
});
const cancelSchema = z.object({ action: z.literal("cancel") });

export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { sessionId } = parseOrThrow(idSchema, await params);
    const session = await uploadSessionService.get(sessionId, userId);
    return NextResponse.json({ session });
  },
);

export const PATCH = withErrorHandling(
  async (request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { sessionId } = parseOrThrow(idSchema, await params);
    const body = await request.json();
    if (body.action === "complete") {
      const input = parseOrThrow(completeSchema, body);
      const session = await uploadSessionService.complete(
        sessionId,
        userId,
        input,
      );
      return NextResponse.json({ session });
    }
    if (body.action === "cancel") {
      const input = parseOrThrow(cancelSchema, body);
      const session = await uploadSessionService.cancel(sessionId, userId);
      return NextResponse.json({ session });
    }
    const range = parseOrThrow(rangeSchema, body);
    const session = await uploadSessionService.recordRange(
      sessionId,
      userId,
      range,
    );
    return NextResponse.json({ session });
  },
);
