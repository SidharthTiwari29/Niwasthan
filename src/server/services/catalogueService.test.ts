import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/server/errors/AppError";
import { prisma } from "@/server/db/prisma";
import { notificationService } from "@/server/services/notificationService";
import {
  addCataloguePrice,
  bulkImportCatalogue,
  countCatalogue,
  getCatalogueItem,
  listCatalogue,
  listCatalogueCategories,
  upsertCatalogueItem,
} from "./catalogueService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    catalogueItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    cataloguePrice: { create: vi.fn(), findFirst: vi.fn() },
    boqLine: { findMany: vi.fn() },
  },
}));

vi.mock("@/server/services/notificationService", () => ({
  notificationService: { notify: vi.fn() },
}));

const db = vi.mocked(prisma, { deep: true });
const mockNotify = vi.mocked(notificationService.notify);

// A real, safe default so every existing test - none of which are
// actually about price-drop detection - doesn't need its own
// boilerplate mock just to avoid a real crash from the new code path.
// Tests that DO care about price-drop behavior override this
// explicitly.
db.cataloguePrice.findFirst.mockResolvedValue(null);

describe("catalogueService", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listCatalogue", () => {
    it("lists only active items, optionally filtered by category", async () => {
      db.catalogueItem.findMany.mockResolvedValue([
        { id: "item-1", sku: "SKU-1" },
      ] as never);

      const result = await listCatalogue("sofa");

      expect(db.catalogueItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            category: "sofa",
          }),
        }),
      );
      expect(result).toEqual([{ id: "item-1", sku: "SKU-1" }]);
    });

    it("paginates using a real, fixed page size - page 1 has no skip", async () => {
      db.catalogueItem.findMany.mockResolvedValue([]);

      await listCatalogue(undefined, 1);

      expect(db.catalogueItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30, skip: 0 }),
      );
    });

    it("paginates correctly for a later page - hand-verified: page 3 skips 60 real rows", async () => {
      db.catalogueItem.findMany.mockResolvedValue([]);

      await listCatalogue(undefined, 3);

      expect(db.catalogueItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30, skip: 60 }),
      );
    });

    it("filters by a real, case-insensitive name search when given", async () => {
      db.catalogueItem.findMany.mockResolvedValue([]);

      await listCatalogue(undefined, 1, "plywood");

      expect(db.catalogueItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "plywood", mode: "insensitive" },
          }),
        }),
      );
    });

    it("never applies a name filter when no real search term is given", async () => {
      db.catalogueItem.findMany.mockResolvedValue([]);

      await listCatalogue();

      const call = db.catalogueItem.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty("name");
    });
  });

  describe("countCatalogue", () => {
    it("counts only active items matching the real filters, mirroring listCatalogue", async () => {
      db.catalogueItem.count.mockResolvedValue(42);

      const result = await countCatalogue("sofa", "leather");

      expect(db.catalogueItem.count).toHaveBeenCalledWith({
        where: {
          active: true,
          category: "sofa",
          name: { contains: "leather", mode: "insensitive" },
        },
      });
      expect(result).toBe(42);
    });
  });

  describe("listCatalogueCategories", () => {
    it("returns the real, distinct categories currently in the catalogue", async () => {
      db.catalogueItem.findMany.mockResolvedValue([
        { category: "Plywood" },
        { category: "Lighting" },
      ] as never);

      const result = await listCatalogueCategories();

      expect(db.catalogueItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
          distinct: ["category"],
        }),
      );
      expect(result).toEqual(["Plywood", "Lighting"]);
    });
  });

  describe("getCatalogueItem", () => {
    it("returns null for a SKU that does not exist or is inactive", async () => {
      db.catalogueItem.findFirst.mockResolvedValue(null);

      const result = await getCatalogueItem("NONEXISTENT-SKU");

      expect(result).toBeNull();
    });

    it("returns the real item with its latest price and a real category-peer count for a known, active SKU", async () => {
      db.catalogueItem.findFirst.mockResolvedValue({
        id: "item-1",
        sku: "SKU-1",
        category: "sofa",
      } as never);
      db.catalogueItem.count.mockResolvedValue(4);

      const result = await getCatalogueItem("SKU-1");

      expect(db.catalogueItem.count).toHaveBeenCalledWith({
        where: { category: "sofa", active: true },
      });
      expect(result).toEqual({
        id: "item-1",
        sku: "SKU-1",
        category: "sofa",
        alternativesConsidered: 4,
      });
    });
  });

  describe("upsertCatalogueItem", () => {
    it("creates or updates the item by its real SKU", async () => {
      db.catalogueItem.upsert.mockResolvedValue({
        id: "item-1",
        sku: "SKU-1",
      } as never);

      const result = await upsertCatalogueItem({
        sku: "SKU-1",
        name: "Modular Sofa",
        category: "sofa",
        unit: "piece",
      });

      expect(db.catalogueItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sku: "SKU-1" } }),
      );
      expect(result).toEqual({ id: "item-1", sku: "SKU-1" });
    });

    it("includes the real new metadata fields only when genuinely provided", async () => {
      db.catalogueItem.upsert.mockResolvedValue({ id: "item-2" } as never);

      await upsertCatalogueItem({
        sku: "SKU-2",
        name: "Marine Plywood",
        category: "boards",
        unit: "sheet",
        imageUrl: "https://example.com/image.jpg",
        sourceUrl: "https://example.com/product",
        qualityTier: "Premium",
        niwasthanRating: 4.6,
      });

      expect(db.catalogueItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            imageUrl: "https://example.com/image.jpg",
            sourceUrl: "https://example.com/product",
            qualityTier: "Premium",
            niwasthanRating: 4.6,
          }),
        }),
      );
    });

    it("never sends the new metadata fields as explicit undefined when genuinely absent - a real, absent key, not a present key holding undefined", async () => {
      db.catalogueItem.upsert.mockResolvedValue({ id: "item-3" } as never);

      await upsertCatalogueItem({
        sku: "SKU-3",
        name: "Basic Item",
        category: "misc",
        unit: "piece",
      });

      const call = db.catalogueItem.upsert.mock.calls[0][0];
      expect(call.create).not.toHaveProperty("imageUrl");
      expect(call.create).not.toHaveProperty("sourceUrl");
      expect(call.create).not.toHaveProperty("qualityTier");
      expect(call.create).not.toHaveProperty("niwasthanRating");
    });
  });

  describe("addCataloguePrice", () => {
    it("rejects adding a price for a SKU that does not exist", async () => {
      db.catalogueItem.findUnique.mockResolvedValue(null);

      await expect(
        addCataloguePrice({ sku: "NONEXISTENT-SKU", amountMinor: 20_000n }),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(db.cataloguePrice.create).not.toHaveBeenCalled();
    });

    it("creates a real price for an existing item, defaulting currency to INR", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({
        id: "item-1",
        sku: "SKU-1",
      } as never);
      db.cataloguePrice.create.mockResolvedValue({
        id: "price-1",
        amountMinor: 20_000n,
      } as never);

      const result = await addCataloguePrice({
        sku: "SKU-1",
        amountMinor: 20_000n,
      });

      expect(db.cataloguePrice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itemId: "item-1",
            amountMinor: 20_000n,
            currency: "INR",
          }),
        }),
      );
      expect(result).toEqual({ id: "price-1", amountMinor: 20_000n });
    });

    it("uses the real, explicitly given currency when provided instead of the INR default", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({ id: "item-1" } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-1" } as never);

      await addCataloguePrice({
        sku: "SKU-1",
        amountMinor: 20_000n,
        currency: "USD",
      });

      expect(db.cataloguePrice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currency: "USD" }),
        }),
      );
    });

    it("passes through the real MRP, warranty, and availability fields when given", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({ id: "item-1" } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-1" } as never);

      await addCataloguePrice({
        sku: "SKU-1",
        amountMinor: 20_000n,
        mrpMinor: 24_000n,
        warrantyMonths: 12,
        availability: "IN_STOCK",
      });

      expect(db.cataloguePrice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mrpMinor: 24_000n,
            warrantyMonths: 12,
            availability: "IN_STOCK",
          }),
        }),
      );
    });

    it("defaults availability to UNKNOWN, never silently to IN_STOCK, when not given", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({ id: "item-1" } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-1" } as never);

      await addCataloguePrice({ sku: "SKU-1", amountMinor: 20_000n });

      expect(db.cataloguePrice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ availability: "UNKNOWN" }),
        }),
      );
    });

    it("fires the real PRICE_DROP moment to every real customer with this item in a BOQ, only for a genuine drop", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Real Sofa",
      } as never);
      db.cataloguePrice.findFirst.mockResolvedValue({
        amountMinor: 50_000n,
      } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-2" } as never);
      db.boqLine.findMany.mockResolvedValue([
        { boq: { project: { ownerId: "user-1" } } },
        { boq: { project: { ownerId: "user-2" } } },
      ] as never);

      await addCataloguePrice({ sku: "SKU-1", amountMinor: 40_000n });

      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", type: "PRICE_DROP" }),
      );
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2", type: "PRICE_DROP" }),
      );
    });

    it("never fires PRICE_DROP when the real new price is not actually lower", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Real Sofa",
      } as never);
      db.cataloguePrice.findFirst.mockResolvedValue({
        amountMinor: 40_000n,
      } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-2" } as never);

      await addCataloguePrice({ sku: "SKU-1", amountMinor: 45_000n });

      expect(mockNotify).not.toHaveBeenCalled();
      expect(db.boqLine.findMany).not.toHaveBeenCalled();
    });

    it("never fires PRICE_DROP for a real, genuinely first-ever price on an item - there is no real previous price to compare against", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Real Sofa",
      } as never);
      db.cataloguePrice.findFirst.mockResolvedValue(null);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-1" } as never);

      await addCataloguePrice({ sku: "SKU-1", amountMinor: 40_000n });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("never notifies the same real customer twice, even if they have the item in multiple real BOQs", async () => {
      db.catalogueItem.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Real Sofa",
      } as never);
      db.cataloguePrice.findFirst.mockResolvedValue({
        amountMinor: 50_000n,
      } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-2" } as never);
      db.boqLine.findMany.mockResolvedValue([
        { boq: { project: { ownerId: "user-1" } } },
        { boq: { project: { ownerId: "user-1" } } },
      ] as never);

      await addCataloguePrice({ sku: "SKU-1", amountMinor: 40_000n });

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });
  });

  describe("bulkImportCatalogue", () => {
    it("imports every real, valid row and reports each as IMPORTED", async () => {
      db.catalogueItem.upsert.mockResolvedValue({ id: "item-1" } as never);
      db.catalogueItem.findUnique.mockResolvedValue({ id: "item-1" } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-1" } as never);

      const results = await bulkImportCatalogue([
        {
          sku: "SKU-1",
          name: "Modular Sofa",
          category: "sofa",
          unit: "piece",
          amountMinor: 20_000n,
        },
        {
          sku: "SKU-2",
          name: "Dining Table",
          category: "dining",
          unit: "piece",
          amountMinor: 35_000n,
        },
      ]);

      expect(results).toEqual([
        { sku: "SKU-1", status: "IMPORTED" },
        { sku: "SKU-2", status: "IMPORTED" },
      ]);
    });

    it("isolates a real per-row failure - one bad row never discards the others", async () => {
      db.catalogueItem.upsert.mockResolvedValue({ id: "item-1" } as never);
      // First row's price-add fails (item lookup returns null); second
      // row succeeds normally.
      db.catalogueItem.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "item-2" } as never);
      db.cataloguePrice.create.mockResolvedValue({ id: "price-2" } as never);

      const results = await bulkImportCatalogue([
        {
          sku: "SKU-BAD",
          name: "Broken Row",
          category: "sofa",
          unit: "piece",
          amountMinor: 20_000n,
        },
        {
          sku: "SKU-GOOD",
          name: "Good Row",
          category: "sofa",
          unit: "piece",
          amountMinor: 25_000n,
        },
      ]);

      expect(results[0].status).toBe("FAILED");
      expect(results[0].reason).toContain("CatalogueItem");
      expect(results[1].status).toBe("IMPORTED");
    });

    it("imports a real item with no verified price honestly - never fabricates a price, and never calls addCataloguePrice at all", async () => {
      db.catalogueItem.upsert.mockResolvedValue({ id: "item-1" } as never);

      const results = await bulkImportCatalogue([
        {
          sku: "SKU-NO-PRICE",
          name: "Dealer-Enquiry-Only Item",
          category: "custom",
          unit: "set",
        },
      ]);

      expect(results).toEqual([{ sku: "SKU-NO-PRICE", status: "IMPORTED" }]);
      expect(db.cataloguePrice.create).not.toHaveBeenCalled();
    });
  });
});
