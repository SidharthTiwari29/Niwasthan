import { prisma } from "@/server/db/prisma";

export async function getPropertyMemory(propertyId: string, ownerId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, ownerId },
    select: {
      id: true,
      name: true,
      homeDnaVersions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
}
