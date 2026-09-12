import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { z } from "zod";
import { createPurchase } from "@/server/payments/purchaseService";
import { consumeRateLimit } from "@/server/security/rateLimit";
import { getEnv } from "@/server/config/env";

const schema = z.object({
  packageCode: z.string().min(1).max(64),
  voluntaryContributionMinor: z.number().int().nonnegative().optional(),
});

export const POST = withErrorHandling(async (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rate = await consumeRateLimit({
    key: `payment-order:${clientIp}`,
    limit: 10,
    windowSeconds: 60,
  });
  if (!rate.allowed)
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED" },
      { status: 429 },
    );

  const actor = await requireAuth();
  const input = parseOrThrow(schema, await request.json());
  const purchase = await createPurchase(
    actor.userId,
    input.packageCode,
    input.voluntaryContributionMinor
      ? BigInt(input.voluntaryContributionMinor)
      : undefined,
  );
  return NextResponse.json(
    {
      purchase: {
        id: purchase.id,
        packageCode: purchase.package.code,
        providerOrderId: purchase.providerOrderId,
        amountMinor: purchase.amountMinor.toString(),
        discountMinor: purchase.discountMinor.toString(),
        platformFeeMinor: purchase.platformFeeMinor.toString(),
        gstMinor: purchase.gstMinor.toString(),
        voluntaryContributionMinor:
          purchase.voluntaryContributionMinor.toString(),
        currency: purchase.currency,
      },
      // Razorpay's key ID is a real, publicly-shareable credential (per
      // Razorpay's own documentation, unlike the secret) - the client-
      // side checkout widget needs it to open. Returned here instead of
      // a separate NEXT_PUBLIC_ env var so the founder configures this
      // value exactly once.
      razorpayKeyId: getEnv().RAZORPAY_KEY_ID,
    },
    { status: 201 },
  );
});
