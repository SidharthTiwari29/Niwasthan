import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { createAssetSchema } from "@/server/validators/asset";
import { uploadSessionService } from "@/server/services/uploadSessionService";

const bodySchema = createAssetSchema.extend({
  idempotencyKey: z.string().trim().min(8).max(128),
  expiresInSeconds: z.number().int().min(60).max(900).optional(),
});

export const POST = withErrorHandling(async (request: Request) => {
  const { userId } = await requireAuth();
  const input = parseOrThrow(bodySchema, await request.json());
  const session = await uploadSessionService.create(userId, input);
  return NextResponse.json({ session }, { status: 201 });
});
