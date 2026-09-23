import { prisma } from "@/server/db/prisma";
import { notificationService } from "@/server/services/notificationService";
import {
  assertAgentActionAllowed,
  beginActionAttempt,
  createAgentEscalation,
  finishActionAttempt,
} from "./agentGovernanceService";

const AGENT_NAME = "EXECUTION_QUALITY";

type Classification =
  "UNRESOLVED_SNAGS" | "READY_FOR_HANDOVER" | "WAITING_FOR_EXECUTION";

export async function observeExecutionAndAct(
  executionId: string,
  ownerId: string,
) {
  const execution = await prisma.executionRecord.findFirst({
    where: { id: executionId, order: { procurementRequest: { ownerId } } },
    include: {
      snags: true,
      order: {
        include: { procurementRequest: { select: { propertyId: true } } },
      },
    },
  });
  if (!execution) return null;

  const unresolvedCount = execution.snags.filter(
    (snag) => snag.status !== "RESOLVED" && snag.status !== "ACCEPTED",
  ).length;
  const classification: Classification =
    unresolvedCount > 0
      ? "UNRESOLVED_SNAGS"
      : execution.status === "COMPLETED" || execution.status === "RESOLVED"
        ? "READY_FOR_HANDOVER"
        : "WAITING_FOR_EXECUTION";
  const evidence = {
    executionId,
    executionStatus: execution.status,
    snagCount: execution.snags.length,
    unresolvedCount,
    observedAt: new Date().toISOString(),
  };
  const observation = await prisma.agentObservation.create({
    data: {
      agentName: AGENT_NAME,
      capability: "EXECUTION_AND_QUALITY",
      classification,
      evidence,
      userId: ownerId,
      propertyId: execution.order.procurementRequest.propertyId,
    },
  });

  const actionType =
    classification === "UNRESOLVED_SNAGS"
      ? "ESCALATE_UNRESOLVED_SNAGS"
      : classification === "READY_FOR_HANDOVER"
        ? "NOTIFY_HANDOVER_READY"
        : "NO_AUTONOMOUS_ACTION";
  const actionClass = classification === "WAITING_FOR_EXECUTION" ? "A" : "B";
  const reasoning =
    classification === "UNRESOLVED_SNAGS"
      ? "Unresolved customer-visible quality issues require attention; the agent may notify but cannot accept handover or modify execution state."
      : classification === "READY_FOR_HANDOVER"
        ? "Execution is complete and no unresolved snags remain; notifying the owner is a safe, reversible action. Handover acceptance remains human-controlled."
        : "Execution is not complete and there is no safe autonomous action to take.";
  const decision = await prisma.agentDecision.create({
    data: {
      observationId: observation.id,
      actionClass,
      decision: actionType,
      reasoning,
    },
  });
  if (classification === "UNRESOLVED_SNAGS") {
    await createAgentEscalation({
      agentName: AGENT_NAME,
      severity: "WARNING",
      reason: `${unresolvedCount} unresolved snag(s) require human/customer attention.`,
      observationId: observation.id,
      decisionId: decision.id,
    });
  }
  if (actionType !== "NO_AUTONOMOUS_ACTION") {
    await assertAgentActionAllowed({
      agentName: AGENT_NAME,
      actionClass,
      actionType,
    });
  }
  const idempotencyKey = `execution-quality:${executionId}:${classification}:${execution.updatedAt.toISOString()}`;
  let action;
  try {
    action = await prisma.agentAction.create({
      data: { decisionId: decision.id, actionType, idempotencyKey },
    });
  } catch {
    return { observation, decision, duplicate: true };
  }

  if (actionType === "NO_AUTONOMOUS_ACTION") {
    return prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: "SKIPPED",
        completedAt: new Date(),
        result: { reason: "No safe action" },
      },
    });
  }

  const attempt = await beginActionAttempt(action.id, 1);
  try {
    await notificationService.notify({
      userId: ownerId,
      type: "EXECUTION_STATUS_CHANGED",
      title:
        classification === "READY_FOR_HANDOVER"
          ? "Handover review is ready"
          : "Execution issue needs attention",
      message:
        classification === "READY_FOR_HANDOVER"
          ? "Execution is complete and recorded snags are resolved or accepted. Review handover before accepting it."
          : `${unresolvedCount} unresolved snag${unresolvedCount === 1 ? "" : "s"} remain${unresolvedCount === 1 ? "s" : ""} in the execution record.`,
      relatedEntityType: "ExecutionRecord",
      relatedEntityId: executionId,
    });
    await finishActionAttempt(attempt.id, {
      status: "VERIFIED",
      result: { notificationSent: true, unresolvedCount },
    });
    return prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: "VERIFIED",
        completedAt: new Date(),
        result: { notificationSent: true, unresolvedCount },
      },
    });
  } catch (error) {
    await finishActionAttempt(attempt.id, {
      status: "FAILED",
      error:
        error instanceof Error ? error.message : "Unknown notification failure",
    });
    await prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        result: {
          error:
            error instanceof Error
              ? error.message
              : "Unknown notification failure",
        },
      },
    });
    return action;
  }
}
