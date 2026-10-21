import { prisma } from "@/server/db/prisma";
import { notificationService } from "@/server/services/notificationService";
import { projectOptimizationService } from "@/server/services/projectOptimizationService";
import {
  assertAgentActionAllowed,
  beginActionAttempt,
  createAgentEscalation,
  finishActionAttempt,
} from "./agentGovernanceService";

const AGENT_NAME = "BOQ_BUDGET";

type Classification =
  "BUDGET_AT_HIGH_ENVELOPE" | "TRADE_OFF_AVAILABLE" | "ON_TRACK";

// README §15: the "BOQ & Budget Operations Agent" from the specialist
// roster. Rule-based (same honest "modelProvider: rule-based" as
// EXECUTION_QUALITY - no AI call pretending to reason about money),
// read-only over the real budgetRepository/projectOptimizationService
// data already built this session, and strictly notify-only: this
// agent can never modify a budget, commit a saving, or change any
// financial truth - that authority stays entirely with the human
// owner (see the BOQ_BUDGET AgentPolicy's prohibitedActions).
export async function observeBudgetAndAct(propertyId: string, ownerId: string) {
  const optimization = await projectOptimizationService.optimize(
    propertyId,
    ownerId,
  );
  if (!optimization) return null;

  // Genuine over-commitment signal: the plan's own target has already
  // reached its own estimated ceiling - not a guess, the same
  // low/target/high range the budget page and What-If both use.
  const atHighEnvelope =
    optimization.totalHighMinor > 0n &&
    optimization.totalTargetMinor >= optimization.totalHighMinor;
  const hasTradeOff = optimization.recommendations.length > 0;

  const classification: Classification = atHighEnvelope
    ? "BUDGET_AT_HIGH_ENVELOPE"
    : hasTradeOff
      ? "TRADE_OFF_AVAILABLE"
      : "ON_TRACK";

  const evidence = {
    budgetVersionId: optimization.budgetVersionId,
    version: optimization.version,
    totalTargetMinor: optimization.totalTargetMinor.toString(),
    totalHighMinor: optimization.totalHighMinor.toString(),
    recommendationCount: optimization.recommendations.length,
    observedAt: new Date().toISOString(),
  };

  const observation = await prisma.agentObservation.create({
    data: {
      agentName: AGENT_NAME,
      capability: "BOQ_AND_BUDGET",
      classification,
      evidence,
      userId: ownerId,
      propertyId,
    },
  });

  const actionType =
    classification === "BUDGET_AT_HIGH_ENVELOPE"
      ? "NOTIFY_BUDGET_AT_HIGH_ENVELOPE"
      : classification === "TRADE_OFF_AVAILABLE"
        ? "NOTIFY_TRADE_OFF_AVAILABLE"
        : "NO_AUTONOMOUS_ACTION";
  // Both real actions stay Class B (notify-only, reversible, no
  // financial-truth change); ON_TRACK needs no action at all.
  const actionClass = classification === "ON_TRACK" ? "A" : "B";
  const reasoning =
    classification === "BUDGET_AT_HIGH_ENVELOPE"
      ? "The plan's own target has reached its estimated high ceiling; notifying the owner is a safe, reversible action. Only the owner can revise the plan or commit a What-If."
      : classification === "TRADE_OFF_AVAILABLE"
        ? "A genuine, bounded cross-room reallocation is available within the plan's own low/high ranges; surfacing it is safe and reversible."
        : "The plan is within its own estimated range and no room has a real trade-off to offer right now.";

  const decision = await prisma.agentDecision.create({
    data: {
      observationId: observation.id,
      actionClass,
      decision: actionType,
      reasoning,
    },
  });

  if (classification === "BUDGET_AT_HIGH_ENVELOPE") {
    await createAgentEscalation({
      agentName: AGENT_NAME,
      severity: "WARNING",
      reason:
        "Budget target has reached its own estimated high ceiling for this property.",
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

  const idempotencyKey = `boq-budget:${propertyId}:${optimization.budgetVersionId}:${classification}`;
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
        result: { reason: "On track" },
      },
    });
  }

  const attempt = await beginActionAttempt(action.id, 1);
  try {
    await notificationService.notify({
      userId: ownerId,
      type:
        classification === "BUDGET_AT_HIGH_ENVELOPE"
          ? "BUDGET_EXCEEDED"
          : "GENERAL",
      title:
        classification === "BUDGET_AT_HIGH_ENVELOPE"
          ? "Budget has reached its estimated ceiling"
          : "A real budget trade-off is available",
      message:
        classification === "BUDGET_AT_HIGH_ENVELOPE"
          ? "Your project's target spend has reached the top of its own estimated range. Review the Budget & BOQ page to decide what to revise."
          : `${optimization.recommendations.length} real reallocation(s) between rooms are available within your existing budget range. Review them on the Budget & BOQ page.`,
      relatedEntityType: "BudgetVersion",
      relatedEntityId: optimization.budgetVersionId,
    });
    await finishActionAttempt(attempt.id, {
      status: "VERIFIED",
      result: { notificationSent: true, classification },
    });
    return prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: "VERIFIED",
        completedAt: new Date(),
        result: { notificationSent: true, classification },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown notification failure";
    await finishActionAttempt(attempt.id, { status: "FAILED", error: message });
    return prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        result: { error: message },
      },
    });
  }
}
