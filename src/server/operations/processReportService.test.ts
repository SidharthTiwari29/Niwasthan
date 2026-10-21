import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { sendFounderReportEmail } from "./founderReportEmail";
import { generateFounderReportMetrics } from "./founderReportService";
import { correlateProcessLead } from "./processLeadService";
import {
  createAndDeliverFounderReport,
  createFounderReportSnapshot,
  deliverFounderReportSnapshot,
} from "./processReportService";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    processReport: { create: vi.fn(), findUnique: vi.fn() },
    processReportDelivery: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("./founderReportEmail", () => ({
  sendFounderReportEmail: vi.fn(),
}));

vi.mock("./founderReportService", () => ({
  generateFounderReportMetrics: vi.fn(),
}));

vi.mock("./processLeadService", () => ({
  correlateProcessLead: vi.fn(),
}));

const db = vi.mocked(prisma, { deep: true });
const mockedSendEmail = vi.mocked(sendFounderReportEmail);
const mockedMetrics = vi.mocked(generateFounderReportMetrics);
const mockedCorrelate = vi.mocked(correlateProcessLead);

const period = {
  start: new Date("2026-09-01T00:00:00Z"),
  end: new Date("2026-09-02T00:00:00Z"),
};

describe("createFounderReportSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedMetrics.mockResolvedValue({
      period,
      generatedAt: new Date("2026-09-02T06:00:00Z"),
      customerActivity: {
        newCustomers: 1,
        propertiesCreated: 1,
        floorPlansUploaded: 1,
        designsGenerated: 1,
      },
      commercialPerformance: {
        paidOrders: 1,
        grossSalesMinor: 100_000,
        averageOrderValueMinor: 100_000,
      },
      openIncidents: { critical: 0, error: 0, total: 0 },
      notYetAvailable: [],
    } as never);
    mockedCorrelate.mockResolvedValue({
      classification: "VERIFIED_FACT",
      specialistSignals: [],
    } as never);
    db.processReport.create.mockResolvedValue({ id: "report-1" } as never);
  });

  it("combines real founder metrics with the real cross-agent Process Lead correlation into one stored snapshot", async () => {
    await createFounderReportSnapshot(period);

    expect(mockedMetrics).toHaveBeenCalledWith(period);
    expect(mockedCorrelate).toHaveBeenCalledWith(period);
    expect(db.processReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportType: "FOUNDER_DAILY",
          periodStart: period.start,
          periodEnd: period.end,
          validation: "VALIDATED_FACTS_AND_EXPLICIT_GAPS",
          payload: expect.objectContaining({
            processLead: expect.objectContaining({
              classification: "VERIFIED_FACT",
            }),
          }),
        }),
      }),
    );
  });
});

describe("deliverFounderReportSnapshot", () => {
  const storedReport = {
    id: "report-1",
    periodStart: period.start,
    periodEnd: period.end,
    payload: {
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      generatedAt: "2026-09-02T06:00:00.000Z",
      customerActivity: {
        newCustomers: 1,
        propertiesCreated: 1,
        floorPlansUploaded: 1,
        designsGenerated: 1,
      },
      commercialPerformance: {
        paidOrders: 1,
        grossSalesMinor: 100_000,
        averageOrderValueMinor: 100_000,
      },
      openIncidents: { critical: 0, error: 0, total: 0 },
      notYetAvailable: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    db.processReport.findUnique.mockResolvedValue(storedReport as never);
  });

  it("throws when the report id does not exist, rather than silently delivering nothing", async () => {
    db.processReport.findUnique.mockResolvedValueOnce(null);

    await expect(deliverFounderReportSnapshot("missing")).rejects.toThrow(
      "PROCESS_REPORT_NOT_FOUND",
    );
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("is idempotent - a report already DELIVERED is never re-sent", async () => {
    db.processReportDelivery.findUnique.mockResolvedValue({
      id: "delivery-1",
      status: "DELIVERED",
    } as never);

    const result = await deliverFounderReportSnapshot("report-1");

    expect(result.deduplicated).toBe(true);
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(db.processReportDelivery.create).not.toHaveBeenCalled();
  });

  it("sends a genuine email and records DELIVERED on real success", async () => {
    db.processReportDelivery.findUnique.mockResolvedValue(null);
    db.processReportDelivery.create.mockResolvedValue({
      id: "delivery-1",
    } as never);
    mockedSendEmail.mockResolvedValue(undefined);
    db.processReportDelivery.update.mockResolvedValue({
      id: "delivery-1",
      status: "DELIVERED",
    } as never);

    const result = await deliverFounderReportSnapshot("report-1");

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(db.processReportDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DELIVERED" }),
      }),
    );
    expect(result.deduplicated).toBe(false);
  });

  it("records a genuine FAILED delivery and re-throws, rather than reporting success when sending actually errored", async () => {
    db.processReportDelivery.findUnique.mockResolvedValue(null);
    db.processReportDelivery.create.mockResolvedValue({
      id: "delivery-1",
    } as never);
    mockedSendEmail.mockRejectedValue(new Error("SMTP connection reset"));
    db.processReportDelivery.update.mockResolvedValue({} as never);

    await expect(deliverFounderReportSnapshot("report-1")).rejects.toThrow(
      "SMTP connection reset",
    );

    expect(db.processReportDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          failure: "SMTP connection reset",
        }),
      }),
    );
  });
});

describe("createAndDeliverFounderReport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("composes snapshot creation and delivery into one real pipeline", async () => {
    mockedMetrics.mockResolvedValue({
      notYetAvailable: [],
    } as never);
    mockedCorrelate.mockResolvedValue({
      classification: "VERIFIED_FACT",
    } as never);
    db.processReport.create.mockResolvedValue({ id: "report-1" } as never);
    db.processReport.findUnique.mockResolvedValue({
      id: "report-1",
      periodStart: period.start,
      periodEnd: period.end,
      payload: {
        period: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
        },
        generatedAt: "2026-09-02T06:00:00.000Z",
        notYetAvailable: [],
      },
    } as never);
    db.processReportDelivery.findUnique.mockResolvedValue(null);
    db.processReportDelivery.create.mockResolvedValue({
      id: "delivery-1",
    } as never);
    mockedSendEmail.mockResolvedValue(undefined);
    db.processReportDelivery.update.mockResolvedValue({
      status: "DELIVERED",
    } as never);

    const result = await createAndDeliverFounderReport(period);

    expect(db.processReport.create).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(result.delivery).toEqual(
      expect.objectContaining({ status: "DELIVERED" }),
    );
  });
});
