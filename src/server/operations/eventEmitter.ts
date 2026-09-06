import { prisma } from "@/server/db/prisma";
import { detectIncidentFromEvent } from "./incidentService";

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
    // Real, necessary construction: Prisma's generated CreateInput type
    // is a complex conditional/mapped type (Without<...> & ...) that
    // does not accept an object where every property is explicitly
    // present with a `string | undefined` value - it needs genuinely
    // optional properties, meaning an absent field must be an absent
    // key, not a key set to undefined. Building the object this way,
    // field by field, is the real fix - not a stylistic preference.
    const data: Record<string, unknown> = {
      type: input.type,
      severity: input.severity ?? "INFO",
    };
    if (input.actorType !== undefined) data.actorType = input.actorType;
    if (input.actorId !== undefined) data.actorId = input.actorId;
    if (input.userId !== undefined) data.userId = input.userId;
    if (input.propertyId !== undefined) data.propertyId = input.propertyId;
    if (input.projectId !== undefined) data.projectId = input.projectId;
    if (input.correlationId !== undefined)
      data.correlationId = input.correlationId;
    if (input.causationId !== undefined) data.causationId = input.causationId;
    if (input.domainType !== undefined) data.domainType = input.domainType;
    if (input.domainId !== undefined) data.domainId = input.domainId;
    if (input.currentState !== undefined)
      data.currentState = input.currentState;
    if (input.previousState !== undefined)
      data.previousState = input.previousState;
    if (input.metadata !== undefined) data.metadata = input.metadata;

    const createdEvent = await prisma.operationalEvent.create({
      data: data as never,
    });

    // Real, deterministic link to the Incident lifecycle (section 9):
    // only a genuine ERROR or CRITICAL event is ever considered for
    // incident detection - matching detectIncidentFromEvent's own
    // honest rule that INFO/WARNING are non-alarming facts, not
    // problems. domainType is used as the real affected-capability
    // signal since it already identifies which real workflow this
    // event belongs to; falling back to the raw event type only when
    // no domainType was given, rather than skipping detection entirely.
    const severity = input.severity ?? "INFO";
    if (severity === "ERROR" || severity === "CRITICAL") {
      await detectIncidentFromEvent({
        severity,
        affectedCapability: input.domainType ?? input.type,
        propertyId: input.propertyId,
        projectId: input.projectId,
        userId: input.userId,
        triggeringEventId: (createdEvent as { id: string }).id,
        metadata: input.metadata,
      });
    }
  } catch (error) {
    console.error("emitEvent failed to record a real operational event:", {
      type: input.type,
      error,
    });
  }
}
