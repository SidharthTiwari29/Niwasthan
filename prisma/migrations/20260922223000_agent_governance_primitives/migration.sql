-- CreateTable
CREATE TABLE "AgentActionAttempt" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "AgentActionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "result" JSONB,
    CONSTRAINT "AgentActionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentEscalation" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "severity" "EventSeverity" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "humanRequired" BOOLEAN NOT NULL DEFAULT true,
    "observationId" TEXT,
    "decisionId" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "AgentEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalMetricSnapshot" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "value" DECIMAL(20,4),
    "numerator" DECIMAL(20,4),
    "denominator" DECIMAL(20,4),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "source" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPolicy" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "readableScopes" JSONB NOT NULL,
    "allowedTools" JSONB NOT NULL,
    "autonomousActionClasses" JSONB NOT NULL,
    "prohibitedActions" JSONB NOT NULL,
    "maxActionAttempts" INTEGER NOT NULL DEFAULT 1,
    "maxRetries" INTEGER NOT NULL DEFAULT 0,
    "escalationThreshold" INTEGER NOT NULL DEFAULT 1,
    "financialLimitMinor" BIGINT,
    "customerImpactRule" TEXT NOT NULL,
    "modelProvider" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentActionAttempt_actionId_attemptNo_key" ON "AgentActionAttempt"("actionId", "attemptNo");
CREATE UNIQUE INDEX "AgentPolicy_agentName_key" ON "AgentPolicy"("agentName");
CREATE INDEX "AgentActionAttempt_status_startedAt_idx" ON "AgentActionAttempt"("status", "startedAt");
CREATE INDEX "AgentEscalation_status_severity_createdAt_idx" ON "AgentEscalation"("status", "severity", "createdAt");
CREATE INDEX "AgentEscalation_agentName_createdAt_idx" ON "AgentEscalation"("agentName", "createdAt");
CREATE INDEX "OperationalMetricSnapshot_metricName_periodStart_periodEnd_idx" ON "OperationalMetricSnapshot"("metricName", "periodStart", "periodEnd");
CREATE INDEX "OperationalMetricSnapshot_classification_createdAt_idx" ON "OperationalMetricSnapshot"("classification", "createdAt");
CREATE INDEX "AgentPolicy_workflow_enabled_idx" ON "AgentPolicy"("workflow", "enabled");

ALTER TABLE "AgentActionAttempt" ADD CONSTRAINT "AgentActionAttempt_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "AgentAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentEscalation" ADD CONSTRAINT "AgentEscalation_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "AgentObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentEscalation" ADD CONSTRAINT "AgentEscalation_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AgentDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AgentPolicy" ("id", "agentName", "workflow", "readableScopes", "allowedTools", "autonomousActionClasses", "prohibitedActions", "maxActionAttempts", "maxRetries", "escalationThreshold", "customerImpactRule", "modelProvider", "timeoutMs", "enabled", "version", "createdAt", "updatedAt")
VALUES ('agent_policy_execution_quality', 'EXECUTION_QUALITY', 'EXECUTION_AND_QUALITY', '["execution", "snags", "handover"]', '["notificationService"]', '["A", "B"]', '["accept_handover", "change_execution_state", "change_financial_truth"]', 1, 0, 1, 'Notify owner only; human retains handover authority.', 'rule-based', 10000, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
