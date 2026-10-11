import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { propertyIdParamSchema } from "@/server/validators/homeIntelligence";
import { projectOptimizationService } from "@/server/services/projectOptimizationService";
import { NotFoundError } from "@/server/errors/AppError";

type RouteParams = { params: Promise<{ id: string }> };

const serializeBigInts = (value: unknown): unknown => {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serializeBigInts);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        serializeBigInts(nested),
      ]),
    );
  }
  return value;
};

// GET /api/properties/[id]/project-optimization
//
// README §10: cross-room, project-level optimization. Reads the
// property's latest real BudgetVersion (same persisted data the
// Budget/BOQ pages already use) and surfaces trade-off recommendations
// for reallocating budget across rooms, always bounded by each room's
// already-estimated low/high range so a recommendation can never
// silently grow the total project cost.
export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { id } = parseOrThrow(propertyIdParamSchema, await params);
    const result = await projectOptimizationService.optimize(id, userId);
    if (!result) {
      throw new NotFoundError("Budget plan");
    }
    return NextResponse.json({ result: serializeBigInts(result) });
  },
);
