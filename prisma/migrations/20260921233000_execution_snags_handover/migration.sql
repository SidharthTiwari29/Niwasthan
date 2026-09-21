-- CreateEnum
CREATE TYPE "SnagStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('READY_FOR_REVIEW', 'ACCEPTED', 'REOPENED');

-- CreateTable
CREATE TABLE "Snag" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SnagStatus" NOT NULL DEFAULT 'OPEN',
    "evidenceAssetIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "Snag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverRecord" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'READY_FOR_REVIEW',
    "notes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HandoverRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HandoverRecord_executionId_key" ON "HandoverRecord"("executionId");
CREATE INDEX "Snag_executionId_status_createdAt_idx" ON "Snag"("executionId", "status", "createdAt");
CREATE INDEX "HandoverRecord_propertyId_status_createdAt_idx" ON "HandoverRecord"("propertyId", "status", "createdAt");

ALTER TABLE "Snag" ADD CONSTRAINT "Snag_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "ExecutionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HandoverRecord" ADD CONSTRAINT "HandoverRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HandoverRecord" ADD CONSTRAINT "HandoverRecord_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "ExecutionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
