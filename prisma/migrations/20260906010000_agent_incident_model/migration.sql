-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DETECTED', 'ACKNOWLEDGED', 'DIAGNOSING', 'ACTION_PLANNED', 'ACTION_EXECUTED', 'VERIFYING', 'RESOLVED', 'ESCALATED', 'REMEDIATED', 'VERIFIED');

-- CreateTable
CREATE TABLE "AgentIncident" (
    "id" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DETECTED',
    "severity" "EventSeverity" NOT NULL,
    "affectedCapability" TEXT NOT NULL,
    "propertyId" TEXT,
    "projectId" TEXT,
    "userId" TEXT,
    "triggeringEventId" TEXT,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "rootCauseClassification" TEXT,
    "recurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "preventionRecommendation" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentIncident_status_severity_idx" ON "AgentIncident"("status", "severity");

-- CreateIndex
CREATE INDEX "AgentIncident_affectedCapability_idx" ON "AgentIncident"("affectedCapability");

-- CreateIndex
CREATE INDEX "AgentIncident_propertyId_idx" ON "AgentIncident"("propertyId");
