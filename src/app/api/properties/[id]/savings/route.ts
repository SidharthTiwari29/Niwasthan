import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { propertyIdParamSchema } from "@/server/validators/homeIntelligence";
import { savingRepository } from "@/server/repositories/savingRepository";

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

// Real, previously-missing surface for README §9's accepted/realised
// distinction: every real Saving row this property's owner has -
// never filtered to only ACCEPTED or only REALISED, since a customer
// genuinely benefits from seeing both the full accepted history and
// which of those are backed by real transaction evidence.
export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteParams) => {
    const { userId } = await requireAuth();
    const { id } = parseOrThrow(propertyIdParamSchema, await params);
    const savings = await savingRepository.listForProperty(id, userId);
    return NextResponse.json({ savings: serializeBigInts(savings) });
  },
);
