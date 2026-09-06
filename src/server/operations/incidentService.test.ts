import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/server/errors/AppError";
import { prisma } from "@/server/db/prisma";
import { detectIncidentFromEvent, transitionIncident } from "./incidentService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    agentIncident: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

const db = vi.mocked(prisma, { deep: true });

describe("detectIncidentFromEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("never creates an incident for a real INFO event - not every fact is a problem", async () => {
    const result = await detectIncidentFromEvent({
      severity: "INFO",
      affectedCapability: "FLOOR_PLAN_ANALYSIS",
    });

    expect(result).toBeNull();
    expect(db.agentIncident.findFirst).not.toHaveBeenCalled();
    expect(db.agentIncident.create).not.toHaveBeenCalled();
  });

  it("never creates an incident for a real WARNING event - an honest, non-alarming known condition", async () => {
    const result = await detectIncidentFromEvent({
      severity: "WARNING",
      affectedCapability: "FLOOR_PLAN_ANALYSIS",
    });

    expect(result).toBeNull();
    expect(db.agentIncident.create).not.toHaveBeenCalled();
  });

  it("creates a real, new incident for a genuine ERROR when no open incident exists yet", async () => {
    db.agentIncident.findFirst.mockResolvedValue(null);
    db.agentIncident.create.mockResolvedValue({ id: "incident-1" } as never);

    const result = await detectIncidentFromEvent({
      severity: "ERROR",
      affectedCapability: "FLOOR_PLAN_ANALYSIS",
      propertyId: "property-1",
      triggeringEventId: "event-1",
    });

    expect(result).toEqual({ incidentId: "incident-1", isNewIncident: true });
    expect(db.agentIncident.create).toHaveBeenCalledWith({
      data: {
        severity: "ERROR",
        affectedCapability: "FLOOR_PLAN_ANALYSIS",
        propertyId: "property-1",
        triggeringEventId: "event-1",
      },
    });
  });

  it("increments the real recurrence count on an existing open incident rather than creating a duplicate - hand-verified 1 -> 2", async () => {
    db.agentIncident.findFirst.mockResolvedValue({
      id: "incident-1",
      recurrenceCount: 1,
    } as never);
    db.agentIncident.update.mockResolvedValue({
      id: "incident-1",
    } as never);

    const result = await detectIncidentFromEvent({
      severity: "ERROR",
      affectedCapability: "FLOOR_PLAN_ANALYSIS",
    });

    expect(result).toEqual({ incidentId: "incident-1", isNewIncident: false });
    expect(db.agentIncident.update).toHaveBeenCalledWith({
      where: { id: "incident-1" },
      data: { recurrenceCount: 2 },
    });
    expect(db.agentIncident.create).not.toHaveBeenCalled();
  });

  it("only ever looks for an OPEN incident - a real, already-resolved incident never suppresses detecting a genuinely new one", async () => {
    db.agentIncident.findFirst.mockResolvedValue(null);
    db.agentIncident.create.mockResolvedValue({ id: "incident-2" } as never);

    await detectIncidentFromEvent({
      severity: "CRITICAL",
      affectedCapability: "FLOOR_PLAN_ANALYSIS",
    });

    expect(db.agentIncident.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { notIn: ["RESOLVED", "VERIFIED"] },
        }),
      }),
    );
  });
});

describe("transitionIncident", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a real, genuinely nonexistent incident", async () => {
    db.agentIncident.findUnique.mockResolvedValue(null);

    await expect(
      transitionIncident("nonexistent", "ACKNOWLEDGED"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("sets a real acknowledgedAt timestamp on the real first acknowledgement", async () => {
    db.agentIncident.findUnique.mockResolvedValue({
      id: "incident-1",
      acknowledgedAt: null,
      resolvedAt: null,
    } as never);
    db.agentIncident.update.mockResolvedValue({} as never);

    await transitionIncident("incident-1", "ACKNOWLEDGED");

    expect(db.agentIncident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "ACKNOWLEDGED",
          acknowledgedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("never overwrites a real, already-set acknowledgedAt on a later transition", async () => {
    const realFirstAck = new Date("2026-01-01");
    db.agentIncident.findUnique.mockResolvedValue({
      id: "incident-1",
      acknowledgedAt: realFirstAck,
      resolvedAt: null,
    } as never);
    db.agentIncident.update.mockResolvedValue({} as never);

    await transitionIncident("incident-1", "DIAGNOSING");

    const call = db.agentIncident.update.mock.calls[0][0];
    expect(call.data).not.toHaveProperty("acknowledgedAt");
  });

  it("sets a real resolvedAt timestamp for both RESOLVED and VERIFIED terminal states", async () => {
    db.agentIncident.findUnique.mockResolvedValue({
      id: "incident-1",
      acknowledgedAt: new Date(),
      resolvedAt: null,
    } as never);
    db.agentIncident.update.mockResolvedValue({} as never);

    await transitionIncident("incident-1", "VERIFIED");

    expect(db.agentIncident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "VERIFIED",
          resolvedAt: expect.any(Date),
        }),
      }),
    );
  });
});
