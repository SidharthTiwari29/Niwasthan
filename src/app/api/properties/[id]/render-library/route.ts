import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { propertyIdParamSchema } from "@/server/validators/homeIntelligence";
import { assetService } from "@/server/services/assetService";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/properties/[id]/render-library
//
// A real asset library for past renders, previously missing entirely:
// every DESIGN_IMAGE/PANORAMA/THREE_D_SCENE/WALKTHROUGH/VIDEO asset
// genuinely produced for this property's design projects, each with a
// freshly-signed download URL.
export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { id } = parseOrThrow(propertyIdParamSchema, await params);
    const assets = await assetService.listRenderLibrary(id, userId);
    return NextResponse.json({ assets });
  },
);
