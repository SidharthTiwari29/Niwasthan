import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export const assetRepository = {
  findById(id: string) {
    return prisma.asset.findUnique({ where: { id } });
  },

  // The actual cache-hit lookup: checksum here stores the render cache key
  // (see renderCache.ts), not a file-content hash - reusing this existing
  // column rather than adding a new one, since the semantic overlap
  // (a stable identifier for "this exact content already exists") is
  // genuine, and adding a duplicate column with the same purpose would be
  // unnecessary schema growth.
  findByChecksum(checksum: string) {
    return prisma.asset.findFirst({ where: { checksum } });
  },

  findDesignVersionContext(id: string) {
    return prisma.designVersion.findUnique({
      where: { id },
      select: {
        project: {
          select: { ownerId: true, propertyId: true },
        },
      },
    });
  },

  findJobContext(id: string) {
    return prisma.aIJob.findUnique({
      where: { id },
      select: {
        project: {
          select: { ownerId: true, propertyId: true },
        },
      },
    });
  },

  // A floor plan (and other genuinely property-level uploads) has no
  // design version or AI job yet - it's typically the very first thing
  // uploaded, before any design work exists. Real, direct ownership
  // verification against the property itself, matching the same shape
  // the other two context lookups return.
  findPropertyContext(id: string) {
    return prisma.property.findUnique({
      where: { id },
      select: { ownerId: true, id: true },
    });
  },

  createForDesignVersion(input: {
    designVersionId: string;
    type: Prisma.AssetCreateInput["type"];
    contentType: string;
    sizeBytes?: bigint;
    checksum?: string;
    metadata?: Prisma.InputJsonValue;
    objectKey: string;
  }) {
    return prisma.asset.create({
      data: {
        type: input.type,
        objectKey: input.objectKey,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        checksum: input.checksum,
        metadata: input.metadata,
        designVersion: { connect: { id: input.designVersionId } },
      },
    });
  },

  createForJob(input: {
    jobId: string;
    type: Prisma.AssetCreateInput["type"];
    contentType: string;
    sizeBytes?: bigint;
    checksum?: string;
    metadata?: Prisma.InputJsonValue;
    objectKey: string;
  }) {
    return prisma.asset.create({
      data: {
        type: input.type,
        objectKey: input.objectKey,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        checksum: input.checksum,
        metadata: input.metadata,
        job: { connect: { id: input.jobId } },
      },
    });
  },

  // README: "an asset library for past renders" - every render-type
  // asset (not floor plans/room photos/OTHER) genuinely produced for
  // this property's design projects, newest first. Ownership is
  // enforced in the same WHERE clause, not a separate check, so an
  // asset belonging to someone else's project is structurally
  // unreachable here, not just policy-forbidden.
  listRenderableForProperty(propertyId: string, ownerId: string) {
    return prisma.asset.findMany({
      where: {
        type: {
          in: [
            "DESIGN_IMAGE",
            "PANORAMA",
            "THREE_D_SCENE",
            "WALKTHROUGH",
            "VIDEO",
          ],
        },
        designVersion: {
          project: { propertyId, ownerId },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        type: true,
        objectKey: true,
        contentType: true,
        createdAt: true,
        designVersionId: true,
        designVersion: {
          select: { projectId: true, version: true },
        },
      },
    });
  },

  createForProperty(input: {
    propertyId: string;
    type: Prisma.AssetCreateInput["type"];
    contentType: string;
    sizeBytes?: bigint;
    checksum?: string;
    metadata?: Prisma.InputJsonValue;
    objectKey: string;
  }) {
    return prisma.asset.create({
      data: {
        type: input.type,
        objectKey: input.objectKey,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        checksum: input.checksum,
        metadata: input.metadata,
        property: { connect: { id: input.propertyId } },
      },
    });
  },
};
