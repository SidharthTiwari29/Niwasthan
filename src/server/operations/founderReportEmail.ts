import { getEnv } from "@/server/config/env";
import { sendEmail } from "@/server/email/emailService";
import type { FounderReportMetrics } from "./founderReportService";

function formatMinor(amountMinor: number): string {
  return `₹${(amountMinor / 100).toLocaleString("en-IN")}`;
}

// Real, honest formatting: every real number gets a line; every
// section listed in notYetAvailable gets an explicit, visible "not yet
// available" line rather than being silently omitted (an omitted
// section could be misread as "nothing to report" - a real, present
// line saying the section doesn't exist yet is the honest version of
// that same information).
function buildReportText(metrics: FounderReportMetrics): string {
  const { customerActivity, commercialPerformance, openIncidents } = metrics;
  const periodLabel = `${metrics.period.start.toISOString().slice(0, 10)} to ${metrics.period.end.toISOString().slice(0, 10)}`;

  const lines = [
    `NIWASTHAN OPERATIONS REPORT`,
    `Period: ${periodLabel}`,
    ``,
    `CUSTOMER ACTIVITY`,
    `New customers: ${customerActivity.newCustomers}`,
    `Properties created: ${customerActivity.propertiesCreated}`,
    `Floor plans uploaded: ${customerActivity.floorPlansUploaded}`,
    `Designs generated: ${customerActivity.designsGenerated}`,
    ``,
    `COMMERCIAL PERFORMANCE`,
    `Paid orders: ${commercialPerformance.paidOrders}`,
    `Gross sales: ${formatMinor(commercialPerformance.grossSalesMinor)}`,
    `Average order value: ${
      commercialPerformance.averageOrderValueMinor !== null
        ? formatMinor(commercialPerformance.averageOrderValueMinor)
        : "No orders in this period"
    }`,
    ``,
    `OPEN INCIDENTS`,
    `Critical: ${openIncidents.critical}`,
    `Error: ${openIncidents.error}`,
    `Total open: ${openIncidents.total}`,
    ``,
    `NOT YET AVAILABLE`,
    ...metrics.notYetAvailable.map((section) => `- ${section}`),
  ];

  return lines.join("\n");
}

function buildReportHtml(metrics: FounderReportMetrics): string {
  // Same real content as the plain-text version, in the same order -
  // deliberately not a richer or different report, just a second real
  // rendering of the identical facts.
  return `<pre style="font-family: monospace; white-space: pre-wrap;">${buildReportText(
    metrics,
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;
}

// Real delivery to the real, configured founder address. Throws the
// same real EMAIL_NOT_CONFIGURED error as sendEmail itself when SMTP
// isn't set up - this function adds no new failure mode, just the
// real formatting and the real recipient.
export async function sendFounderReportEmail(
  metrics: FounderReportMetrics,
): Promise<void> {
  const env = getEnv();
  await sendEmail({
    to: env.FOUNDER_REPORT_EMAIL,
    subject: `Niwasthan operations report - ${metrics.period.start.toISOString().slice(0, 10)}`,
    text: buildReportText(metrics),
    html: buildReportHtml(metrics),
  });
}
