import { prisma } from "@/server/db/prisma";

export const savingRepository = {
  create(input: {
    propertyId: string;
    ownerId: string;
    budgetImpactId: string;
    currentPriceMinor: bigint | null;
    proposedPriceMinor: bigint | null;
    savingMinor: bigint | null;
    reason: string;
  }) {
    return prisma.saving.create({ data: input });
  },

  listForProperty(propertyId: string, ownerId: string) {
    return prisma.saving.findMany({
      where: { propertyId, ownerId },
      orderBy: { createdAt: "desc" },
    });
  },

  findForOwner(savingId: string, ownerId: string) {
    return prisma.saving.findFirst({ where: { id: savingId, ownerId } });
  },

  // Real, deliberate guard against double-marking: only a genuinely
  // ACCEPTED saving transitions to REALISED here - updateMany's where
  // clause enforces this atomically rather than checking status in a
  // separate read, so a concurrent duplicate request cannot both
  // succeed.
  markRealised(
    savingId: string,
    ownerId: string,
    evidence: { type: string; id: string },
  ) {
    return prisma.saving.updateMany({
      where: { id: savingId, ownerId, status: "ACCEPTED" },
      data: {
        status: "REALISED",
        realisedEvidenceType: evidence.type,
        realisedEvidenceId: evidence.id,
        realisedAt: new Date(),
      },
    });
  },
};
