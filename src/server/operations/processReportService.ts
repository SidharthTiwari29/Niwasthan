import { prisma } from "@/server/db/prisma";
import { sendFounderReportEmail } from "./founderReportEmail";
import {
  generateFounderReportMetrics,
  type FounderReportMetrics,
  type ReportPeriod,
} from "./founderReportService";
import { correlateProcessLead } from "./processLeadService";

function reportKey(period: ReportPeriod) {
  return `founder-report:email:${period.start.toISOString()}:${period.end.toISOString()}`;
}

export async function createFounderReportSnapshot(period: ReportPeriod) {
  const [metrics, processLead] = await Promise.all([
    generateFounderReportMetrics(period),
    correlateProcessLead(period),
  ]);
  const payload = JSON.parse(JSON.stringify({ ...metrics, processLead })) as object;
  return prisma.processReport.create({
    data: {
      reportType: "FOUNDER_DAILY",
      periodStart: period.start,
      periodEnd: period.end,
      payload,
      validation: "VALIDATED_FACTS_AND_EXPLICIT_GAPS",
    },
  });
}

export async function deliverFounderReportSnapshot(reportId: string) {
  const report = await prisma.processReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("PROCESS_REPORT_NOT_FOUND");
  const stored = report.payload as unknown as Omit<FounderReportMetrics, "period" | "generatedAt"> & {
    period: { start: string; end: string };
    generatedAt: string;
  };
  const metrics: FounderReportMetrics = {
    ...stored,
    period: { start: new Date(stored.period.start), end: new Date(stored.period.end) },
    generatedAt: new Date(stored.generatedAt),
  };
  const idempotencyKey = reportKey({ start: report.periodStart, end: report.periodEnd });
  const existing = await prisma.processReportDelivery.findUnique({ where: { idempotencyKey } });
  if (existing?.status === "DELIVERED") return { report, delivery: existing, deduplicated: true };

  const delivery = existing ?? await prisma.processReportDelivery.create({
    data: {
      reportId,
      channel: "EMAIL",
      destination: "FOUNDER_REPORT_EMAIL",
      idempotencyKey,
    },
  });

  try {
    await sendFounderReportEmail(metrics);
    const updated = await prisma.processReportDelivery.update({
      where: { id: delivery.id },
      data: { status: "DELIVERED", deliveredAt: new Date(), failure: null },
    });
    return { report, delivery: updated, deduplicated: false };
  } catch (error) {
    await prisma.processReportDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", failure: error instanceof Error ? error.message : "UNKNOWN_DELIVERY_FAILURE" },
    });
    throw error;
  }
}

export async function createAndDeliverFounderReport(period: ReportPeriod) {
  const report = await createFounderReportSnapshot(period);
  return deliverFounderReportSnapshot(report.id);
}
