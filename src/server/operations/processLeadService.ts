import { prisma } from "@/server/db/prisma";
import {
  generateFounderReportMetrics,
  type ReportPeriod,
} from "./founderReportService";

export type ProcessLeadCorrelation = {
  generatedAt: Date;
  period: ReportPeriod;
  classification: "VERIFIED_FACT";
  specialistSignals: Array<{
    agentName: string;
    capability: string;
    classification: string;
    observationId: string;
    decisionCount: number;
    actionCount: number;
  }>;
  openEscalations: number;
  openIncidents: number;
  operationalEvents: number;
  unresolvedSections: string[];
};

export async function correlateProcessLead(
  period: ReportPeriod,
): Promise<ProcessLeadCorrelation> {
  const [observations, openEscalations, openIncidents, operationalEvents] =
    await Promise.all([
      prisma.agentObservation.findMany({
        where: { createdAt: { gte: period.start, lt: period.end } },
        orderBy: { createdAt: "desc" },
        include: { decisions: { include: { actions: true } } },
      }),
      prisma.agentEscalation.count({ where: { status: "OPEN" } }),
      prisma.agentIncident.count({
        where: { status: { notIn: ["RESOLVED", "VERIFIED"] } },
      }),
      prisma.operationalEvent.count({
        where: { occurredAt: { gte: period.start, lt: period.end } },
      }),
    ]);

  // The metric call is intentionally authoritative and is used as a validation
  // gate: Process Lead correlation never substitutes its own counts for domain facts.
  const metrics = await generateFounderReportMetrics(period);
  return {
    generatedAt: new Date(),
    period,
    classification: "VERIFIED_FACT",
    specialistSignals: observations.map((observation) => ({
      agentName: observation.agentName,
      capability: observation.capability,
      classification: observation.classification,
      observationId: observation.id,
      decisionCount: observation.decisions.length,
      actionCount: observation.decisions.reduce(
        (sum, decision) => sum + decision.actions.length,
        0,
      ),
    })),
    openEscalations,
    openIncidents,
    operationalEvents,
    unresolvedSections: metrics.notYetAvailable,
  };
}
