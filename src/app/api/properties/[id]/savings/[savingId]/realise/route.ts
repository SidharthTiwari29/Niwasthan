import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { propertyIdParamSchema } from "@/server/validators/homeIntelligence";
import { savingRepository } from "@/server/repositories/savingRepository";
import { procurementRepository } from "@/server/repositories/procurementRepository";
import { ConflictError, NotFoundError } from "@/server/errors/AppError";

type RouteParams = { params: Promise<{ id: string; savingId: string }> };

const bodySchema = z.object({
  orderId: z.string().min(1),
});

// Real, previously-missing mechanism for README §9's REALISED state -
// deliberately never automatic. A saving only becomes REALISED when a
// caller supplies a real orderId, and that order is independently
// verified here (via the same real findOrderForOwner the procurement
// routes already use) to genuinely exist and belong to this same
// owner - never trusted on the caller's claim alone, since an
// unverified evidence reference would make "realised" meaningless.
export const POST = withErrorHandling(
  async (request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { id: propertyId, savingId } = parseOrThrow(
      propertyIdParamSchema.extend({ savingId: z.string().min(1) }),
      await params,
    );
    const { orderId } = parseOrThrow(bodySchema, await request.json());

    const saving = await savingRepository.findForOwner(savingId, userId);
    if (!saving || saving.propertyId !== propertyId) {
      throw new NotFoundError("Saving");
    }

    const order = await procurementRepository.findOrderForOwner(
      orderId,
      userId,
    );
    if (!order) throw new NotFoundError("Order");

    const updated = await savingRepository.markRealised(savingId, userId, {
      type: "Order",
      id: order.id,
    });
    if (updated.count === 0) {
      throw new ConflictError(
        "This saving is not in a state that can be marked realised",
      );
    }
    return NextResponse.json({ realised: true });
  },
);
