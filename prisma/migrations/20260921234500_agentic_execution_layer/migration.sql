-- CreateEnum
CREATE TYPE "AgentActionStatus" AS ENUM ('PLANNED', 'EXECUTED', 'SKIPPED', 'FAILED', 'VERIFIED');

-- CreateTable
CREATE TABLE "AgentObservation" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT,
    "projectId" TEXT,
    "triggeringEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDecision" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "actionClass" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" "AgentActionStatus" NOT NULL DEFAULT 'PLANNED',
    "idempotencyKey" TEXT NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentAction_idempotencyKey_key" ON "AgentAction"("idempotencyKey");
CREATE INDEX "AgentObservation_agentName_capability_createdAt_idx" ON "AgentObservation"("agentName", "capability", "createdAt");
CREATE INDEX "AgentObservation_propertyId_createdAt_idx" ON "AgentObservation"("propertyId", "createdAt");
CREATE INDEX "AgentDecision_observationId_createdAt_idx" ON "AgentDecision"("observationId", "createdAt");
CREATE INDEX "AgentAction_actionType_status_createdAt_idx" ON "AgentAction"("actionType", "status", "createdAt");

ALTER TABLE "AgentDecision" ADD CONSTRAINT "AgentDecision_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "AgentObservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AgentDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
