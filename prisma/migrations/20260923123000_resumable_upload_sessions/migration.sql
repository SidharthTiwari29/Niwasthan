CREATE TYPE "UploadSessionStatus" AS ENUM ('CREATED', 'UPLOADING', 'CLIENT_VERIFIED', 'UNKNOWN', 'COMPLETED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "UploadSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "expectedBytes" BIGINT,
  "expectedChecksum" TEXT,
  "chunkSizeBytes" INTEGER NOT NULL DEFAULT 5242880,
  "uploadedRanges" JSONB NOT NULL,
  "status" "UploadSessionStatus" NOT NULL DEFAULT 'CREATED',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UploadSession_assetId_key" ON "UploadSession"("assetId");
CREATE UNIQUE INDEX "UploadSession_userId_idempotencyKey_key" ON "UploadSession"("userId", "idempotencyKey");
CREATE INDEX "UploadSession_userId_status_createdAt_idx" ON "UploadSession"("userId", "status", "createdAt");
CREATE INDEX "UploadSession_expiresAt_status_idx" ON "UploadSession"("expiresAt", "status");
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
