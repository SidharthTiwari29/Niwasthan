-- CreateEnum
CREATE TYPE "SavingStatus" AS ENUM ('ACCEPTED', 'REALISED');

-- CreateTable
CREATE TABLE "Saving" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "budgetImpactId" TEXT NOT NULL,
    "currentPriceMinor" BIGINT,
    "proposedPriceMinor" BIGINT,
    "savingMinor" BIGINT,
    "reason" TEXT NOT NULL,
    "status" "SavingStatus" NOT NULL DEFAULT 'ACCEPTED',
    "realisedEvidenceType" TEXT,
    "realisedEvidenceId" TEXT,
    "realisedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Saving_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Saving_budgetImpactId_key" ON "Saving"("budgetImpactId");

-- CreateIndex
CREATE INDEX "Saving_propertyId_ownerId_status_idx" ON "Saving"("propertyId", "ownerId", "status");
