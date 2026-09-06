import { prisma } from "@/server/db/prisma";

export type EventSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type EmitEventInput = {
  type: string;
  actorType?: string;
  actorId?: string;
  userId?: string;
  propertyId?: string;
  projectId?: string;
  correlationId?: string;
  causationId?: string;
  domainType?: string;
  domainId?: string;
  severity?: EventSeverity;
  currentState?: string;
  previousState?: string;
  metadata?: Record<string, unknown>;
};

// Real, deliberately simple entry point for the Facts layer described
// in docs/AGENTIC-OPERATIONS.md section 5: records that something
// actually happened, exactly as the calling domain service observed
// it. This function does not interpret, classify, or react to what it
// records - those are the separate Observations/Hypotheses/Decisions
// layers the same document describes in section 8, which do not exist
// yet. Emitting an event is a real, honest fact recorded to the
// database; it is not, by itself, an agent, a monitor, or an alert.
//
// Deliberately fire-and-forget from the caller's perspective in one
// specific sense: a failure to record an event must never break the
// real domain operation it's describing. A floor-plan analysis that
// succeeds is not made a failure by an event-logging outage - the
// error is swallowed here, not propagated, after being surfaced to
// the server's own error output for real visibility into a genuine
// problem with the event pipeline itself.
export async function emitEvent(input: EmitEventInput): Promise<void> {
  try {
    await prisma.operationalEvent.create({
      data: {
        type: input.type,
        actorType: input.actorType,
        actorId: input.actorId,
        userId: input.userId,
        propertyId: input.propertyId,
        projectId: input.projectId,
        correlationId: input.correlationId,
        causationId: input.causationId,
        domainType: input.domainType,
        domainId: input.domainId,
        severity: input.severity ?? "INFO",
        currentState: input.currentState,
        previousState: input.previousState,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("emitEvent failed to record a real operational event:", {
      type: input.type,
      error,
    });
  }
}
