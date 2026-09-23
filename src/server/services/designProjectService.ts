import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { NotFoundError } from "@/server/errors/AppError";

export async function createDesignProject(input: {
  ownerId: string;
  propertyId: string;
  roomId?: string;
  name: string;
}) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, ownerId: input.ownerId },
  });
  if (!property) throw new NotFoundError("Property");
  if (input.roomId) {
    const room = await prisma.room.findFirst({
      where: { id: input.roomId, propertyId: input.propertyId },
    });
    if (!room) throw new NotFoundError("Room");
  }
  return prisma.designProject.create({
    data: input,
    include: { versions: true, revisions: true },
  });
}

// A design version is created WITHIN a real direction, not floating
// free of one - directionId defaults to the project's currently ACTIVE
// direction when not explicitly given, since that's the real, correct
// default for "generate the next version of what I'm actually building
// right now." An explicit directionId lets a customer generate within a
// direction they're still exploring that isn't active yet (e.g. trying
// out a second style before deciding).
export async function createDesignVersion(input: {
  ownerId: string;
  projectId: string;
  directionId?: string;
  prompt?: string;
  parameters?: Record<string, unknown>;
}) {
  const project = await prisma.designProject.findFirst({
    where: { id: input.projectId, ownerId: input.ownerId },
  });
  if (!project) throw new NotFoundError("DesignProject");

  let directionId = input.directionId;
  if (directionId) {
    const direction = await prisma.designDirection.findFirst({
      where: { id: directionId, projectId: input.projectId },
    });
    if (!direction) throw new NotFoundError("DesignDirection");
  } else {
    const activeDirection = await prisma.designDirection.findFirst({
      where: { projectId: input.projectId, status: "ACTIVE" },
    });
    // A project with no direction at all yet (created before this
    // feature existed, or one that genuinely has none) still allows a
    // version with no direction - directionId stays null, matching the
    // schema's real, additive nullability rather than forcing a
    // fabricated direction into existence just to satisfy this call.
    directionId = activeDirection?.id;
  }

  const latest = await prisma.designVersion.findFirst({
    where: { projectId: input.projectId },
    orderBy: { version: "desc" },
  });
  return prisma.designVersion.create({
    data: {
      projectId: input.projectId,
      directionId,
      version: (latest?.version ?? 0) + 1,
      prompt: input.prompt,
      parameters: input.parameters as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createDesignRevision(input: {
  ownerId: string;
  projectId: string;
  baseVersionId: string;
  instruction: string;
  parameters?: Record<string, unknown>;
}) {
  const project = await prisma.designProject.findFirst({
    where: { id: input.projectId, ownerId: input.ownerId },
  });
  if (!project) throw new NotFoundError("DesignProject");
  const version = await prisma.designVersion.findFirst({
    where: { id: input.baseVersionId, projectId: input.projectId },
  });
  if (!version) throw new NotFoundError("DesignVersion");
  const latest = await prisma.designRevision.findFirst({
    where: { projectId: input.projectId },
    orderBy: { revisionNumber: "desc" },
  });
  return prisma.designRevision.create({
    data: {
      projectId: input.projectId,
      baseVersionId: input.baseVersionId,
      revisionNumber: (latest?.revisionNumber ?? 0) + 1,
      instruction: input.instruction,
      parameters: input.parameters as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listDesignProjectsForProperty(
  propertyId: string,
  ownerId: string,
) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
  });
  if (!property) throw new NotFoundError("Property");
  return prisma.designProject.findMany({
    where: { propertyId, ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDesignProject(projectId: string, ownerId: string) {
  return prisma.designProject.findFirst({
    where: { id: projectId, ownerId },
    include: {
      room: {
        include: {
          roomUnderstandings: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}
