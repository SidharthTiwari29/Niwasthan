-- CreateEnum
CREATE TYPE "NotificationEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Notification"
  ADD COLUMN "emailStatus" "NotificationEmailStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "emailError" TEXT,
  ADD COLUMN "emailSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_emailStatus_createdAt_idx" ON "Notification"("emailStatus", "createdAt");
