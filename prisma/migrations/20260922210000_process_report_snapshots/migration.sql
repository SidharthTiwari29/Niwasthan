-- CreateTable
CREATE TABLE "ProcessReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "validation" TEXT NOT NULL DEFAULT 'VALIDATED',
    CONSTRAINT "ProcessReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessReportDelivery" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "failure" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessReportDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessReportDelivery_idempotencyKey_key" ON "ProcessReportDelivery"("idempotencyKey");
CREATE INDEX "ProcessReport_reportType_periodStart_periodEnd_idx" ON "ProcessReport"("reportType", "periodStart", "periodEnd");
CREATE INDEX "ProcessReport_generatedAt_idx" ON "ProcessReport"("generatedAt");
CREATE INDEX "ProcessReportDelivery_reportId_createdAt_idx" ON "ProcessReportDelivery"("reportId", "createdAt");
CREATE INDEX "ProcessReportDelivery_channel_status_createdAt_idx" ON "ProcessReportDelivery"("channel", "status", "createdAt");

ALTER TABLE "ProcessReportDelivery" ADD CONSTRAINT "ProcessReportDelivery_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ProcessReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
