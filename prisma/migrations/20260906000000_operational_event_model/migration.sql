-- CreateEnum
CREATE TYPE "EventSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorType" TEXT,
    "actorId" TEXT,
    "userId" TEXT,
    "propertyId" TEXT,
    "projectId" TEXT,
    "correlationId" TEXT,
    "causationId" TEXT,
    "domainType" TEXT,
    "domainId" TEXT,
    "severity" "EventSeverity" NOT NULL DEFAULT 'INFO',
    "currentState" TEXT,
    "previousState" TEXT,
    "metadata" JSONB,

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalEvent_type_occurredAt_idx" ON "OperationalEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_correlationId_idx" ON "OperationalEvent"("correlationId");

-- CreateIndex
CREATE INDEX "OperationalEvent_propertyId_idx" ON "OperationalEvent"("propertyId");

-- CreateIndex
CREATE INDEX "OperationalEvent_projectId_idx" ON "OperationalEvent"("projectId");

-- CreateIndex
CREATE INDEX "OperationalEvent_userId_idx" ON "OperationalEvent"("userId");
