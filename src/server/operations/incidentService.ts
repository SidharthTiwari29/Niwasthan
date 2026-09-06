import { prisma } from "@/server/db/prisma";
import { NotFoundError } from "@/server/errors/AppError";

export type IncidentStatus =
  | "DETECTED"
  | "ACKNOWLEDGED"
  | "DIAGNOSING"
  | "ACTION_PLANNED"
  | "ACTION_EXECUTED"
  | "VERIFYING"
  | "RESOLVED"
  | "ESCALATED"
  | "REMEDIATED"
  | "VERIFIED";

export type IncidentSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

// Real, deterministic, rule-based detection - not an AI agent, not a
// heuristic guess. Per docs/AGENTIC-OPERATIONS.md section 6, an
// incident begins at DETECTED; everything past that (ACKNOWLEDGED
// through VERIFIED) is a genuinely separate, later, human-or-agent-
// driven action this function does not perform.
//
// A recurring problem within the same affected capability updates the
// real, existing open incident's recurrence count rather than creating
// a new, disconnected record every time the same underlying condition
// is detected again - matching the spec's own "recurrence count"
// field, computed from real, counted occurrences, never estimated.
export async function detectIncidentFromEvent(input: {
  severity: IncidentSeverity;
  affectedCapability: string;
  propertyId?: string;
  projectId?: string;
  userId?: string;
  triggeringEventId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ incidentId: string; isNewIncident: boolean } | null> {
  // Only a real problem is a real incident - INFO and WARNING are
  // honest, non-alarming facts (matching the same distinction already
  // established when emitting events), not something requiring the
  // incident lifecycle at all.
  if (input.severity !== "ERROR" && input.severity !== "CRITICAL") {
    return null;
  }

  const existingOpenIncident = await prisma.agentIncident.findFirst({
    where: {
      affectedCapability: input.affectedCapability,
      status: { notIn: ["RESOLVED", "VERIFIED"] },
    },
    orderBy: { firstDetectedAt: "desc" },
  });

  if (existingOpenIncident) {
    const updated = await prisma.agentIncident.update({
      where: { id: existingOpenIncident.id },
      data: { recurrenceCount: existingOpenIncident.recurrenceCount + 1 },
    });
    return { incidentId: updated.id, isNewIncident: false };
  }

  const data: Record<string, unknown> = {
    severity: input.severity,
    affectedCapability: input.affectedCapability,
  };
  if (input.propertyId !== undefined) data.propertyId = input.propertyId;
  if (input.projectId !== undefined) data.projectId = input.projectId;
  if (input.userId !== undefined) data.userId = input.userId;
  if (input.triggeringEventId !== undefined)
    data.triggeringEventId = input.triggeringEventId;
  if (input.metadata !== undefined) data.metadata = input.metadata;

  const created = await prisma.agentIncident.create({ data: data as never });
  return { incidentId: created.id, isNewIncident: true };
}

// Real, explicit state transitions - matching the spec's own lifecycle
// diagram exactly. This function does not enforce which transitions
// are "valid" from which prior state; that policy question belongs to
// the future AgentPolicy layer the spec describes in section 17, which
// does not exist yet. This is the honest, minimal primitive: record
// that a real transition happened, with the correct real timestamp
// fields set for ACKNOWLEDGED and the terminal RESOLVED/VERIFIED
// states.
export async function transitionIncident(
  incidentId: string,
  status: IncidentStatus,
): Promise<void> {
  const incident = await prisma.agentIncident.findUnique({
    where: { id: incidentId },
  });
  if (!incident) throw new NotFoundError("AgentIncident");

  const data: Record<string, unknown> = { status };
  if (status === "ACKNOWLEDGED" && !incident.acknowledgedAt) {
    data.acknowledgedAt = new Date();
  }
  if (
    (status === "RESOLVED" || status === "VERIFIED") &&
    !incident.resolvedAt
  ) {
    data.resolvedAt = new Date();
  }

  await prisma.agentIncident.update({
    where: { id: incidentId },
    data: data as never,
  });
}
