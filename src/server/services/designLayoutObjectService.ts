import { prisma } from "@/server/db/prisma";
import { NotFoundError } from "@/server/errors/AppError";

export type DesignLayoutObjectInput = {
  name: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
};

async function assertProject(projectId: string, ownerId: string) {
  const project = await prisma.designProject.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });
  if (!project) throw new NotFoundError("DesignProject");
}

export const designLayoutObjectService = {
  async list(projectId: string, ownerId: string) {
    await assertProject(projectId, ownerId);
    return prisma.designLayoutObject.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  },

  async create(projectId: string, ownerId: string, input: DesignLayoutObjectInput) {
    await assertProject(projectId, ownerId);
    const count = await prisma.designLayoutObject.count({ where: { projectId } });
    if (count >= 50) throw new Error("A design can contain at most 50 layout objects");
    return prisma.designLayoutObject.create({ data: { projectId, ...input } });
  },

  async remove(projectId: string, objectId: string, ownerId: string) {
    await assertProject(projectId, ownerId);
    const result = await prisma.designLayoutObject.deleteMany({
      where: { id: objectId, projectId },
    });
    if (result.count === 0) throw new NotFoundError("DesignLayoutObject");
  },
};
