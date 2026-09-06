import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { designDirectionRepository } from "@/server/repositories/designDirectionRepository";
import { notificationService } from "@/server/services/notificationService";
import { designDirectionService } from "./designDirectionService";

vi.mock("@/server/repositories/designDirectionRepository", () => ({
  designDirectionRepository: {
    findProjectForOwner: vi.fn(),
    findForOwner: vi.fn(),
    listForProject: vi.fn(),
    countForProject: vi.fn(),
    create: vi.fn(),
    activate: vi.fn(),
    reject: vi.fn(),
  },
}));

vi.mock("@/server/services/notificationService", () => ({
  notificationService: { notify: vi.fn() },
}));

const repo = vi.mocked(designDirectionRepository);
const mockNotify = vi.mocked(notificationService.notify);

describe("designDirectionService.createDirection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the project does not exist or is not owned by the caller", async () => {
    repo.findProjectForOwner.mockResolvedValue(null);

    await expect(
      designDirectionService.createDirection(
        "project-1",
        "user-1",
        "Warm Contemporary",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("creates the first direction for a project as the isFirstDirection=true case", async () => {
    repo.findProjectForOwner.mockResolvedValue({ id: "project-1" } as never);
    repo.countForProject.mockResolvedValue(0);
    repo.create.mockResolvedValue({ id: "dir-1", status: "ACTIVE" } as never);

    const result = await designDirectionService.createDirection(
      "project-1",
      "user-1",
      "Warm Contemporary",
    );

    expect(repo.create).toHaveBeenCalledWith(
      "project-1",
      "Warm Contemporary",
      true,
    );
    expect(result.status).toBe("ACTIVE");
  });

  it("creates a second direction as ALTERNATIVE, not automatically active", async () => {
    repo.findProjectForOwner.mockResolvedValue({ id: "project-1" } as never);
    repo.countForProject.mockResolvedValue(1);
    repo.create.mockResolvedValue({
      id: "dir-2",
      status: "ALTERNATIVE",
    } as never);

    await designDirectionService.createDirection(
      "project-1",
      "user-1",
      "Japandi",
    );

    expect(repo.create).toHaveBeenCalledWith("project-1", "Japandi", false);
  });
});

describe("designDirectionService.activateDirection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the direction does not exist or belongs to a different project", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-1",
      projectId: "other-project",
      status: "ALTERNATIVE",
    } as never);

    await expect(
      designDirectionService.activateDirection("project-1", "dir-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.activate).not.toHaveBeenCalled();
  });

  it("rejects reactivating a REJECTED direction - must create a new one instead", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-1",
      projectId: "project-1",
      status: "REJECTED",
    } as never);

    await expect(
      designDirectionService.activateDirection("project-1", "dir-1", "user-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("activates a real alternative direction, calling the atomic repository transaction", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-2",
      projectId: "project-1",
      status: "ALTERNATIVE",
    } as never);
    repo.activate.mockResolvedValue({ id: "dir-2", status: "ACTIVE" } as never);

    const result = await designDirectionService.activateDirection(
      "project-1",
      "dir-2",
      "user-1",
    );

    expect(repo.activate).toHaveBeenCalledWith("project-1", "dir-2");
    expect(result.status).toBe("ACTIVE");
  });

  it("fires the real DESIGN_APPROVED moment when a direction is genuinely activated", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-2",
      projectId: "project-1",
      status: "ALTERNATIVE",
    } as never);
    repo.activate.mockResolvedValue({ id: "dir-2", status: "ACTIVE" } as never);

    await designDirectionService.activateDirection(
      "project-1",
      "dir-2",
      "user-1",
    );

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "DESIGN_APPROVED",
        relatedEntityId: "dir-2",
      }),
    );
  });

  it("surfaces a real conflict if the atomic activation itself fails (e.g. a race)", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-2",
      projectId: "project-1",
      status: "ALTERNATIVE",
    } as never);
    repo.activate.mockResolvedValue(null);

    await expect(
      designDirectionService.activateDirection("project-1", "dir-2", "user-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("designDirectionService.rejectDirection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects rejecting the currently ACTIVE direction - must activate another first", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-1",
      projectId: "project-1",
      status: "ACTIVE",
    } as never);

    await expect(
      designDirectionService.rejectDirection(
        "project-1",
        "dir-1",
        "user-1",
        "Too dark",
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repo.reject).not.toHaveBeenCalled();
  });

  it("rejects an ALTERNATIVE direction with the customer's real stated reason preserved", async () => {
    repo.findForOwner.mockResolvedValue({
      id: "dir-1",
      projectId: "project-1",
      status: "ALTERNATIVE",
    } as never);
    repo.reject.mockResolvedValue({
      id: "dir-1",
      status: "REJECTED",
      rejectionReason: "Too dark",
    } as never);

    const result = await designDirectionService.rejectDirection(
      "project-1",
      "dir-1",
      "user-1",
      "Too dark",
    );

    expect(repo.reject).toHaveBeenCalledWith("dir-1", "Too dark");
    expect(result.rejectionReason).toBe("Too dark");
  });
});
