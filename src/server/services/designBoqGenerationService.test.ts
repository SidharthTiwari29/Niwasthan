import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { designBoqGenerationRepository } from "@/server/repositories/designBoqGenerationRepository";
import { catalogueCurationService } from "@/server/services/catalogueCurationService";
import { designBoqGenerationService } from "./designBoqGenerationService";

vi.mock("@/server/repositories/designBoqGenerationRepository", () => ({
  designBoqGenerationRepository: { findProjectWithRoomForOwner: vi.fn() },
}));
vi.mock("@/server/services/catalogueCurationService", () => ({
  catalogueCurationService: { recommend: vi.fn() },
}));

const repo = vi.mocked(designBoqGenerationRepository);
const curation = vi.mocked(catalogueCurationService);

describe("designBoqGenerationService.generateForProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the project does not exist or is not owned by the caller", async () => {
    repo.findProjectWithRoomForOwner.mockResolvedValue(null);

    await expect(
      designBoqGenerationService.generateForProject(
        "project-1",
        "user-1",
        500_000n,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(curation.recommend).not.toHaveBeenCalled();
  });

  it("rejects a project with no specific room - cannot honestly derive category needs", async () => {
    repo.findProjectWithRoomForOwner.mockResolvedValue({
      id: "project-1",
      room: null,
    } as never);

    await expect(
      designBoqGenerationService.generateForProject(
        "project-1",
        "user-1",
        500_000n,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(curation.recommend).not.toHaveBeenCalled();
  });

  it("rejects a room type with no defined category needs (OTHER) rather than generating nothing silently", async () => {
    repo.findProjectWithRoomForOwner.mockResolvedValue({
      id: "project-1",
      room: { type: "OTHER" },
    } as never);

    await expect(
      designBoqGenerationService.generateForProject(
        "project-1",
        "user-1",
        500_000n,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(curation.recommend).not.toHaveBeenCalled();
  });

  it("requires an active customer-approved direction before downstream BOQ generation", async () => {
    repo.findProjectWithRoomForOwner.mockResolvedValue({
      id: "project-1",
      room: { type: "LIVING_ROOM" },
      directions: [],
    } as never);

    await expect(
      designBoqGenerationService.generateForProject(
        "project-1",
        "user-1",
        500_000n,
      ),
    ).rejects.toThrow("Choose and activate a design direction");
    expect(curation.recommend).not.toHaveBeenCalled();
  });

  it("generates a real recommendation using the room's real category needs", async () => {
    repo.findProjectWithRoomForOwner.mockResolvedValue({
      id: "project-1",
      room: { type: "LIVING_ROOM" },
    } as never);
    curation.recommend.mockResolvedValue({
      id: "rec-1",
      status: "RECOMMENDED",
    } as never);

    const result = await designBoqGenerationService.generateForProject(
      "project-1",
      "user-1",
      500_000n,
    );

    expect(result).toEqual({ id: "rec-1", status: "RECOMMENDED" });
    expect(curation.recommend).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      expect.arrayContaining([expect.objectContaining({ category: "sofa" })]),
      500_000n,
    );
  });
});
