import { NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handler";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { designDirectionService } from "@/server/services/designDirectionService";
import { designDirectionRepository } from "@/server/repositories/designDirectionRepository";
import { NotFoundError } from "@/server/errors/AppError";

type RouteParams = { params: Promise<{ directionId: string }> };

// Real, previously-missing mobile action: a customer can now make a
// direction their active one directly from the Design tab, using the
// exact same real activateDirection logic the web app uses (the
// previous active direction becomes ALTERNATIVE, never deleted - the
// same honest, reversible behavior, not a simplified mobile-only
// rule). The mobile client sends only the direction id, not a project
// id, so this resolves the real owning project itself rather than
// asking the client to track an id it never needed before.
export const POST = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireMobileAuth();
    const { directionId } = await params;
    const direction = await designDirectionRepository.findForOwner(
      directionId,
      userId,
    );
    if (!direction) throw new NotFoundError("DesignDirection");
    const activated = await designDirectionService.activateDirection(
      direction.projectId,
      directionId,
      userId,
    );
    return NextResponse.json({ direction: activated });
  },
);
