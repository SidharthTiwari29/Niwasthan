import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { designBoqGenerationRepository } from "@/server/repositories/designBoqGenerationRepository";
import { catalogueCurationService } from "@/server/services/catalogueCurationService";
import { getRoomCategoryNeeds } from "@/server/services/roomCategoryNeeds";

export const designBoqGenerationService = {
  // This is the real answer to "whatever material/product we use in the
  // design will have a cost which explains the overall budget": rather
  // than a separate, disconnected curation step the customer runs
  // manually, generating a design's real BOQ IS running the real,
  // already-built curation engine (catalogueCurationService.recommend)
  // against the real category needs a room of this type genuinely
  // requires. Nothing new was invented here - this composes two things
  // that were each already real and tested on their own.
  //
  // Deliberately requires a specific room, not a "whole property"
  // design (roomId null) - the category-needs mapping this depends on is
  // per-room-type, so there is no honest way to generate a real BOQ for
  // an unspecified room. A whole-property design would need its own,
  // separate multi-room aggregation - a genuine next step, not
  // approximated here.
  async generateForProject(
    projectId: string,
    ownerId: string,
    targetBudgetMinor: bigint,
  ) {
    const project =
      await designBoqGenerationRepository.findProjectWithRoomForOwner(
        projectId,
        ownerId,
      );
    if (!project) throw new NotFoundError("DesignProject");
    if (!project.room) {
      throw new ConflictError(
        "This design project is not tied to a specific room - generating a real BOQ needs to know which room's needs to curate for",
      );
    }
    if (project.directions && project.directions.length === 0) {
      throw new ConflictError(
        "Choose and activate a design direction before generating a BOQ - procurement must follow an explicit customer decision",
      );
    }

    const needs = getRoomCategoryNeeds(project.room.type);
    if (needs.length === 0) {
      throw new ConflictError(
        `No standard category needs are defined for room type ${project.room.type} yet - a real BOQ cannot be honestly generated without knowing what this room type typically requires`,
      );
    }

    return catalogueCurationService.recommend(
      projectId,
      ownerId,
      needs,
      targetBudgetMinor,
    );
  },
};
