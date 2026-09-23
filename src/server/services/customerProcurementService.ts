import { prisma } from "@/server/db/prisma";

export async function getCustomerProcurement(propertyId: string, ownerId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
    select: {
      id: true,
      name: true,
      procurementRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          quotes: { orderBy: { createdAt: "desc" } },
          orders: { orderBy: { placedAt: "desc" }, take: 3 },
        },
      },
    },
  });
  if (!property) return null;
  return {
    id: property.id,
    name: property.name,
    requests: property.procurementRequests.map((request) => ({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      quotes: request.quotes.map((quote) => ({
        id: quote.id,
        supplierName: quote.supplierName,
        totalAmountMinor: Number(quote.totalAmountMinor),
        currency: quote.currency,
        status: quote.status,
        validUntil: quote.validUntil,
        notes: quote.notes,
      })),
      orders: request.orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmountMinor: Number(order.totalAmountMinor),
        currency: order.currency,
        placedAt: order.placedAt,
      })),
    })),
  };
}
