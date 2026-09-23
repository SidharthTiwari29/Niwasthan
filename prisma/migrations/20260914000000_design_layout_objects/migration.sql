-- CreateTable
CREATE TABLE "DesignLayoutObject" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "xMm" INTEGER NOT NULL,
    "yMm" INTEGER NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "depthMm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignLayoutObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignLayoutObject_projectId_createdAt_idx" ON "DesignLayoutObject"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "DesignLayoutObject" ADD CONSTRAINT "DesignLayoutObject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DesignProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
