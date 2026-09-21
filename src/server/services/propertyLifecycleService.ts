import { prisma } from "@/server/db/prisma";

export async function getPropertyLifecycle(propertyId: string, ownerId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
    select: {
      id: true,
      name: true,
      procurementRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          quotes: { orderBy: { createdAt: "desc" } },
          orders: {
            orderBy: { placedAt: "desc" },
            include: { executions: { orderBy: { createdAt: "desc" } } },
          },
        },
      },
    },
  });
  if (!property) return null;

  const requests = property.procurementRequests.map((request) => ({
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    quoteCount: request.quotes.length,
    quotes: request.quotes.map((quote) => ({
      id: quote.id,
      supplierName: quote.supplierName,
      totalAmountMinor: Number(quote.totalAmountMinor),
      currency: quote.currency,
      status: quote.status,
      validUntil: quote.validUntil,
    })),
    orders: request.orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmountMinor: Number(order.totalAmountMinor),
      currency: order.currency,
      placedAt: order.placedAt,
      deliveredAt: order.deliveredAt,
      executions: order.executions.map((execution) => ({
        id: execution.id,
        status: execution.status,
        scheduledDate: execution.scheduledDate,
        completedAt: execution.completedAt,
        snagNotes: execution.snagNotes,
        resolvedAt: execution.resolvedAt,
      })),
    })),
  }));

  return { id: property.id, name: property.name, requests };
}
