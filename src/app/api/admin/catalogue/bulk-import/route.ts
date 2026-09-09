import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { bulkImportCatalogue } from "@/server/services/catalogueService";

const rowSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(30),
  brand: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  imageUrl: z.string().trim().url().max(2000).optional(),
  sourceUrl: z.string().trim().url().max(2000).optional(),
  qualityTier: z.string().trim().max(50).optional(),
  niwasthanRating: z.number().min(0).max(5).optional(),
  amountMinor: z.number().int().positive().optional(),
  mrpMinor: z.number().int().positive().optional(),
  warrantyMonths: z.number().int().nonnegative().optional(),
  availability: z
    .enum(["IN_STOCK", "LIMITED_STOCK", "OUT_OF_STOCK", "UNKNOWN"])
    .optional(),
});
const bodySchema = z.object({ rows: z.array(rowSchema).min(1).max(1000) });

// The real, ready-now endpoint for turning a real spreadsheet into real
// catalogue data - each row is a plain JSON object matching a
// spreadsheet's columns exactly, converted from CSV via any standard
// tool before sending. Every row is processed and reported
// independently (see bulkImportCatalogue) - a response can contain a
// genuine mix of IMPORTED and FAILED rows, never an all-or-nothing
// failure that discards valid data because of one bad row.
export const POST = withErrorHandling(async (request: Request) => {
  await requireAdmin();
  const { rows } = parseOrThrow(bodySchema, await request.json());
  const results = await bulkImportCatalogue(
    rows.map((row) => ({
      ...row,
      amountMinor:
        row.amountMinor !== undefined ? BigInt(row.amountMinor) : undefined,
      mrpMinor: row.mrpMinor !== undefined ? BigInt(row.mrpMinor) : undefined,
    })),
  );
  return NextResponse.json({ results });
});
