import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { prisma } from "@/server/db/prisma";
import { notificationService } from "@/server/services/notificationService";
import { observeExecutionAndAct } from "@/server/agents/executionQualityAgent";

export const executionEvidenceService = {
  async listSnags(executionId: string, ownerId: string) {
    const execution = await prisma.executionRecord.findFirst({
      where: { id: executionId, order: { procurementRequest: { ownerId } } },
      select: { id: true },
    });
    if (!execution) throw new NotFoundError("ExecutionRecord");
    return prisma.snag.findMany({
      where: { executionId },
      orderBy: { createdAt: "desc" },
    });
  },

  async createSnag(
    executionId: string,
    ownerId: string,
    title: string,
    description: string,
    evidenceAssetIds: string[],
  ) {
    const execution = await prisma.executionRecord.findFirst({
      where: { id: executionId, order: { procurementRequest: { ownerId } } },
      select: { id: true },
    });
    if (!execution) throw new NotFoundError("ExecutionRecord");
    const snag = await prisma.snag.create({
      data: { executionId, title, description, evidenceAssetIds },
    });
    await notificationService.notify({
      userId: ownerId,
      type: "EXECUTION_STATUS_CHANGED",
      title: "Snag recorded",
      message: `${title} was added to the execution record for review`,
      relatedEntityType: "Snag",
      relatedEntityId: snag.id,
    });
    await observeExecutionAndAct(executionId, ownerId);
    return snag;
  },

  async updateSnag(
    snagId: string,
    ownerId: string,
    status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "ACCEPTED",
  ) {
    const snag = await prisma.snag.findFirst({
      where: {
        id: snagId,
        execution: { order: { procurementRequest: { ownerId } } },
      },
    });
    if (!snag) throw new NotFoundError("Snag");
    if (snag.status === "ACCEPTED" && status !== "ACCEPTED")
      throw new ConflictError(
        "An accepted snag cannot be reopened from this workflow",
      );
    const updated = await prisma.snag.update({
      where: { id: snagId },
      data: {
        status,
        resolvedAt:
          status === "RESOLVED" || status === "ACCEPTED" ? new Date() : null,
      },
    });
    await observeExecutionAndAct(updated.executionId, ownerId);
    return updated;
  },

  async getHandover(propertyId: string, ownerId: string) {
    return prisma.handoverRecord.findFirst({
      where: { propertyId, property: { ownerId } },
      include: {
        execution: { include: { snags: { orderBy: { createdAt: "desc" } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createOrReviewHandover(
    propertyId: string,
    executionId: string,
    ownerId: string,
    status: "READY_FOR_REVIEW" | "ACCEPTED" | "REOPENED",
    notes?: string,
  ) {
    const execution = await prisma.executionRecord.findFirst({
      where: {
        id: executionId,
        status: { in: ["COMPLETED", "RESOLVED"] },
        order: { procurementRequest: { propertyId, ownerId } },
      },
      include: { snags: true },
    });
    if (!execution)
      throw new ConflictError(
        "Handover is available only after execution is completed and the order belongs to this home",
      );
    const unresolved = execution.snags.some(
      (snag) => snag.status !== "RESOLVED" && snag.status !== "ACCEPTED",
    );
    if (status === "ACCEPTED" && unresolved)
      throw new ConflictError(
        "Resolve or accept every snag before accepting handover",
      );
    const handover = await prisma.handoverRecord.upsert({
      where: { executionId },
      create: {
        propertyId,
        executionId,
        status,
        notes,
        acceptedAt: status === "ACCEPTED" ? new Date() : null,
      },
      update: {
        status,
        notes,
        acceptedAt: status === "ACCEPTED" ? new Date() : null,
      },
    });
    await notificationService.notify({
      userId: ownerId,
      type: "EXECUTION_STATUS_CHANGED",
      title:
        status === "ACCEPTED"
          ? "Handover accepted"
          : "Handover ready for review",
      message:
        status === "ACCEPTED"
          ? "Your handover record is accepted."
          : "Your execution record is ready for handover review.",
      relatedEntityType: "HandoverRecord",
      relatedEntityId: handover.id,
    });
    return handover;
  },
};
