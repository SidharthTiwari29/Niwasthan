import { prisma } from "@/server/db/prisma";

export async function getAgentPolicy(agentName: string) {
  return prisma.agentPolicy.findUnique({ where: { agentName } });
}

export async function assertAgentActionAllowed(input: {
  agentName: string;
  actionClass: string;
  actionType: string;
}) {
  const policy = await getAgentPolicy(input.agentName);
  if (!policy || !policy.enabled) throw new Error("AGENT_POLICY_UNAVAILABLE");
  const allowed =
    Array.isArray(policy.autonomousActionClasses) &&
    (policy.autonomousActionClasses as unknown[]).includes(input.actionClass);
  const prohibited =
    Array.isArray(policy.prohibitedActions) &&
    (policy.prohibitedActions as unknown[]).includes(input.actionType);
  if (!allowed || prohibited) throw new Error("AGENT_ACTION_NOT_AUTHORIZED");
  return policy;
}

export async function beginActionAttempt(actionId: string, attemptNo: number) {
  return prisma.agentActionAttempt.create({
    data: { actionId, attemptNo, status: "EXECUTED" },
  });
}

export async function finishActionAttempt(
  attemptId: string,
  input: {
    status: "VERIFIED" | "FAILED" | "SKIPPED";
    result?: Record<string, unknown>;
    error?: string;
  },
) {
  return prisma.agentActionAttempt.update({
    where: { id: attemptId },
    data: {
      status: input.status,
      completedAt: new Date(),
      result: input.result as object | undefined,
      error: input.error,
    },
  });
}

export async function createAgentEscalation(input: {
  agentName: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  reason: string;
  observationId?: string;
  decisionId?: string;
  incidentId?: string;
}) {
  return prisma.agentEscalation.create({ data: input });
}
