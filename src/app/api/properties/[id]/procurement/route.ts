import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import {
  createProcurementRequestSchema,
  propertyIdParamSchema,
} from "@/server/validators/procurement";
import { procurementService } from "@/server/services/procurementService";

type RouteParams = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { id } = parseOrThrow(propertyIdParamSchema, await params);
    const body = parseOrThrow(
      createProcurementRequestSchema,
      await request.json(),
    );
    const procurementRequest = await procurementService.create(
      id,
      userId,
      body,
    );
    return NextResponse.json({ procurementRequest }, { status: 201 });
  },
);

// Real, previously-missing capability: a customer had no way to see
// their own real procurement requests for this property at all -
// needed for the "track my order" page.
export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { id } = parseOrThrow(propertyIdParamSchema, await params);
    const procurementRequests = await procurementService.listForProperty(
      id,
      userId,
    );
    return NextResponse.json({ procurementRequests });
  },
);
