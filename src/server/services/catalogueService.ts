import { prisma } from "@/server/db/prisma";
import { NotFoundError } from "@/server/errors/AppError";
import { notificationService } from "@/server/services/notificationService";
import { buildMoment } from "@/server/personality/momentTemplates";

export function listCatalogue(category?: string) {
  return prisma.catalogueItem.findMany({
    where: { active: true, category },
    include: {
      prices: {
        where: {
          effectiveFrom: { lte: new Date() },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
        },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCatalogueItem(sku: string) {
  const item = await prisma.catalogueItem.findFirst({
    where: { sku, active: true },
    include: { prices: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
  });
  if (!item) return null;

  // A real, computed peer count in the same category - what
  // deriveMeritsAndDemerits' alternativesConsidered actually means: how
  // many other real, currently-active options exist to compare this
  // item against, never a fabricated or estimated number.
  const alternativesConsidered = await prisma.catalogueItem.count({
    where: { category: item.category, active: true },
  });

  return { ...item, alternativesConsidered };
}

export async function upsertCatalogueItem(input: {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  brand?: string;
  active?: boolean;
}) {
  return prisma.catalogueItem.upsert({
    where: { sku: input.sku },
    create: input,
    update: input,
  });
}

export async function addCataloguePrice(input: {
  sku: string;
  amountMinor: bigint;
  currency?: string;
  effectiveFrom?: Date;
  mrpMinor?: bigint;
  warrantyMonths?: number;
  availability?: "IN_STOCK" | "LIMITED_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
}) {
  const item = await prisma.catalogueItem.findUnique({
    where: { sku: input.sku },
  });
  if (!item) throw new NotFoundError("CatalogueItem");

  // The real, immediately-preceding price for this exact item, checked
  // BEFORE creating the new one - the only honest way to know whether
  // this is genuinely a drop, not a guess or an assumption that any new
  // price observation is automatically cheaper.
  const previousPrice = await prisma.cataloguePrice.findFirst({
    where: { itemId: item.id },
    orderBy: { effectiveFrom: "desc" },
  });

  const created = await prisma.cataloguePrice.create({
    data: {
      itemId: item.id,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "INR",
      effectiveFrom: input.effectiveFrom ?? new Date(),
      mrpMinor: input.mrpMinor,
      warrantyMonths: input.warrantyMonths,
      availability: input.availability ?? "UNKNOWN",
    },
  });

  // README §29/§30 Niwasthan Moment: real trigger, previously unwired -
  // buildMoment's PRICE_DROP copy existed but nothing in the app ever
  // called it. Only fires for a real, genuine drop (strictly less than
  // the real previous price), and only to real customers who actually
  // have this exact item in a real BOQ line - never a blanket
  // announcement to everyone regardless of relevance.
  if (previousPrice && input.amountMinor < previousPrice.amountMinor) {
    const affectedOwners = await prisma.boqLine.findMany({
      where: { catalogueItemId: item.id },
      select: { boq: { select: { project: { select: { ownerId: true } } } } },
      distinct: ["boqId"],
    });
    const ownerIds = new Set<string>(
      affectedOwners.map(
        (row: { boq: { project: { ownerId: string } } }) =>
          row.boq.project.ownerId,
      ),
    );
    const moment = buildMoment("PRICE_DROP", { itemName: item.name });
    await Promise.all(
      [...ownerIds].map((userId) =>
        notificationService.notify({
          userId,
          type: "PRICE_DROP",
          title: moment.title,
          message: moment.message,
          relatedEntityType: "CatalogueItem",
          relatedEntityId: item.id,
        }),
      ),
    );
  }

  return created;
}

export type CatalogueImportRow = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  brand?: string;
  amountMinor: bigint;
  mrpMinor?: bigint;
  warrantyMonths?: number;
  availability?: "IN_STOCK" | "LIMITED_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
};

export type CatalogueImportResult = {
  sku: string;
  status: "IMPORTED" | "FAILED";
  reason?: string;
};

// The real, concrete bridge from "here is a spreadsheet of real
// products" to actual, live catalogue data - built now, ready the
// moment real rows arrive, rather than something to design later.
// Every row is processed independently: one bad row (a missing
// required field, an invalid price) is recorded as a real per-row
// failure with its actual reason, never silently dropped and never
// allowed to abort the rows that were genuinely valid.
export async function bulkImportCatalogue(
  rows: CatalogueImportRow[],
): Promise<CatalogueImportResult[]> {
  const results: CatalogueImportResult[] = [];

  for (const row of rows) {
    try {
      await upsertCatalogueItem({
        sku: row.sku,
        name: row.name,
        category: row.category,
        unit: row.unit,
        brand: row.brand,
      });
      await addCataloguePrice({
        sku: row.sku,
        amountMinor: row.amountMinor,
        mrpMinor: row.mrpMinor,
        warrantyMonths: row.warrantyMonths,
        availability: row.availability,
      });
      results.push({ sku: row.sku, status: "IMPORTED" });
    } catch (error) {
      results.push({
        sku: row.sku,
        status: "FAILED",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
