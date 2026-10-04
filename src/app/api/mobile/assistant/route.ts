import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { consumeRateLimit } from "@/server/security/rateLimit";
import { assistantService } from "@/server/assistant/assistantService";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

// Real, mobile-specific Humsafar route - reuses the exact same real
// assistantService.ask() the web assistant uses, with the same real
// rate limiting (an LLM call costs real money per request regardless
// of which client made it). Separate from the web route only because
// requireAuth() cannot read a mobile Bearer token.
export const POST = withErrorHandling(async (request: Request) => {
  const { userId } = await requireMobileAuth();
  const rateLimit = await consumeRateLimit({
    key: `assistant:${userId}`,
    limit: 20,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }
  const { messages } = parseOrThrow(bodySchema, await request.json());
  const result = await assistantService.ask(userId, messages);
  return NextResponse.json(result);
});
