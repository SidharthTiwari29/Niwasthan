import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { designDirectionRepository } from "@/server/repositories/designDirectionRepository";
import { notificationService } from "@/server/services/notificationService";
import { buildMoment } from "@/server/personality/momentTemplates";

export const designDirectionService = {
  async createDirection(projectId: string, ownerId: string, name: string) {
    const project = await designDirectionRepository.findProjectForOwner(
      projectId,
      ownerId,
    );
    if (!project) throw new NotFoundError("DesignProject");

    const existingCount =
      await designDirectionRepository.countForProject(projectId);
    return designDirectionRepository.create(
      projectId,
      name,
      existingCount === 0,
    );
  },

  listDirections(projectId: string, ownerId: string) {
    return designDirectionRepository
      .findProjectForOwner(projectId, ownerId)
      .then((project) => {
        if (!project) throw new NotFoundError("DesignProject");
        return designDirectionRepository.listForProject(projectId);
      });
  },

  // The customer explicitly choosing "make this my home" - atomically
  // deactivates whatever was previously active. Never silently mutates
  // in place; the previous active direction becomes ALTERNATIVE, fully
  // preserved, never deleted, so the customer can switch back later.
  async activateDirection(
    projectId: string,
    directionId: string,
    ownerId: string,
  ) {
    const direction = await designDirectionRepository.findForOwner(
      directionId,
      ownerId,
    );
    if (!direction || direction.projectId !== projectId) {
      throw new NotFoundError("DesignDirection");
    }
    if (direction.status === "REJECTED") {
      throw new ConflictError(
        "A rejected direction cannot be reactivated - create a new direction instead",
      );
    }

    const activated = await designDirectionRepository.activate(
      projectId,
      directionId,
    );
    if (!activated) {
      throw new ConflictError("This direction could not be activated");
    }

    // README §29/§30 Niwasthan Moment: real trigger, previously unwired
    // - buildMoment's DESIGN_APPROVED copy existed but nothing in the
    // app ever called it. Activating a direction is the real, actual
    // "the customer approved this design" event.
    const moment = buildMoment("DESIGN_APPROVED");
    await notificationService.notify({
      userId: ownerId,
      type: "DESIGN_APPROVED",
      title: moment.title,
      message: moment.message,
      relatedEntityType: "DesignDirection",
      relatedEntityId: activated.id,
    });

    return activated;
  },

  // Rejecting is real, structured customer feedback, not silent deletion
  // - the direction and its stated reason remain on record, ready to
  // seed the next exploration. The currently ACTIVE direction cannot be
  // rejected directly - the customer must activate a different one
  // first, since a project should never be left with zero real direction
  // feeding its downstream BOQ/budget.
  async rejectDirection(
    projectId: string,
    directionId: string,
    ownerId: string,
    reason: string | undefined,
  ) {
    const direction = await designDirectionRepository.findForOwner(
      directionId,
      ownerId,
    );
    if (!direction || direction.projectId !== projectId) {
      throw new NotFoundError("DesignDirection");
    }
    if (direction.status === "ACTIVE") {
      throw new ConflictError(
        "Cannot reject the currently active direction - activate a different direction first",
      );
    }

    return designDirectionRepository.reject(directionId, reason);
  },
};
