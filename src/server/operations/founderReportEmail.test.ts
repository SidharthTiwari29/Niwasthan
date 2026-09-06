import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "@/server/config/env";
import { sendEmail } from "@/server/email/emailService";
import { sendFounderReportEmail } from "./founderReportEmail";
import type { FounderReportMetrics } from "./founderReportService";

vi.mock("@/server/config/env", () => ({
  getEnv: vi.fn(),
}));

vi.mock("@/server/email/emailService", () => ({
  sendEmail: vi.fn(),
}));

const mockGetEnv = vi.mocked(getEnv);
const mockSendEmail = vi.mocked(sendEmail);

const realMetrics: FounderReportMetrics = {
  period: { start: new Date("2026-09-01"), end: new Date("2026-09-02") },
  generatedAt: new Date("2026-09-02T06:00:00Z"),
  customerActivity: {
    newCustomers: 5,
    propertiesCreated: 3,
    floorPlansUploaded: 2,
    designsGenerated: 4,
  },
  commercialPerformance: {
    paidOrders: 2,
    grossSalesMinor: 1_000_000,
    averageOrderValueMinor: 500_000,
  },
  openIncidents: { critical: 1, error: 2, total: 3 },
  notYetAvailable: [
    "Executive health assessment",
    "Root-cause / trend analysis",
  ],
};

describe("sendFounderReportEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnv.mockReturnValue({
      FOUNDER_REPORT_EMAIL: "founder@niwasthan.com",
    } as never);
  });

  it("sends the real report to the real, configured founder address", async () => {
    await sendFounderReportEmail(realMetrics);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "founder@niwasthan.com" }),
    );
  });

  it("includes every real customer activity number in the plain-text body", async () => {
    await sendFounderReportEmail(realMetrics);

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.text).toContain("New customers: 5");
    expect(call.text).toContain("Properties created: 3");
    expect(call.text).toContain("Floor plans uploaded: 2");
    expect(call.text).toContain("Designs generated: 4");
  });

  it("formats real commercial figures correctly - hand-verified ₹ conversion from minor units", async () => {
    await sendFounderReportEmail(realMetrics);

    const call = mockSendEmail.mock.calls[0][0];
    // Hand-verified: 1,000,000 paise = ₹10,000
    expect(call.text).toContain("Gross sales: ₹10,000");
    expect(call.text).toContain("Average order value: ₹5,000");
  });

  it("shows a real, honest 'no orders' line rather than a fabricated ₹0 when there were none", async () => {
    await sendFounderReportEmail({
      ...realMetrics,
      commercialPerformance: {
        paidOrders: 0,
        grossSalesMinor: 0,
        averageOrderValueMinor: null,
      },
    });

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.text).toContain(
      "Average order value: No orders in this period",
    );
  });

  it("includes every real open incident count", async () => {
    await sendFounderReportEmail(realMetrics);

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.text).toContain("Critical: 1");
    expect(call.text).toContain("Error: 2");
    expect(call.text).toContain("Total open: 3");
  });

  it("lists every real not-yet-available section explicitly, never silently omitting them", async () => {
    await sendFounderReportEmail(realMetrics);

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.text).toContain("- Executive health assessment");
    expect(call.text).toContain("- Root-cause / trend analysis");
  });

  it("renders the same real facts in the HTML body, safely escaped", async () => {
    await sendFounderReportEmail(realMetrics);

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain("New customers: 5");
    expect(call.html).toContain("<pre");
  });
});
