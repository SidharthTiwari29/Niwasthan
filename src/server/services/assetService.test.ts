import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/server/errors/AppError";
import { assetRepository } from "@/server/repositories/assetRepository";
import { getStorageProvider } from "@/server/storage/provider";
import { assetService } from "./assetService";

vi.mock("@/server/repositories/assetRepository", () => ({
  assetRepository: {
    findDesignVersionContext: vi.fn(),
    findJobContext: vi.fn(),
    findPropertyContext: vi.fn(),
    createForDesignVersion: vi.fn(),
    createForJob: vi.fn(),
    createForProperty: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("@/server/storage/provider", () => ({
  getStorageProvider: vi.fn(),
}));

vi.mock("./assetAuthorization", () => ({
  assertAssetOwner: vi.fn(),
  buildAssetObjectKey: vi.fn(
    (userId: string, propertyId: string, assetId: string) =>
      `users/${userId}/properties/${propertyId}/assets/${assetId}`,
  ),
}));

const db = vi.mocked(assetRepository, { deep: true });
const mockStorage = vi.mocked(getStorageProvider);

const baseInput = {
  type: "FLOOR_PLAN" as const,
  contentType: "image/jpeg",
};

describe("assetService.createUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.mockReturnValue({
      createUploadGrant: vi.fn().mockResolvedValue({
        objectKey: "real-key",
        uploadUrl: "https://real-upload-url",
        expiresAt: new Date(),
      }),
      createDownloadUrl: vi.fn(),
    });
  });

  it("rejects when none of designVersionId, jobId, or propertyId is provided", async () => {
    await expect(
      assetService.createUpload("user-1", { ...baseInput } as never),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("uploads via a real design version parent when designVersionId is given", async () => {
    db.findDesignVersionContext.mockResolvedValue({
      project: { ownerId: "user-1", propertyId: "property-1" },
    } as never);
    db.createForDesignVersion.mockResolvedValue({
      objectKey: "real-key",
      contentType: "image/jpeg",
    } as never);

    const result = await assetService.createUpload("user-1", {
      ...baseInput,
      designVersionId: "version-1",
    } as never);

    expect(db.createForDesignVersion).toHaveBeenCalledTimes(1);
    expect(db.createForJob).not.toHaveBeenCalled();
    expect(db.createForProperty).not.toHaveBeenCalled();
    expect(result.grant.objectKey).toBe("real-key");
  });

  it("uploads via a real AI job parent when jobId is given", async () => {
    db.findJobContext.mockResolvedValue({
      project: { ownerId: "user-1", propertyId: "property-1" },
    } as never);
    db.createForJob.mockResolvedValue({
      objectKey: "real-key",
      contentType: "image/jpeg",
    } as never);

    await assetService.createUpload("user-1", {
      ...baseInput,
      jobId: "job-1",
    } as never);

    expect(db.createForJob).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1" }),
    );
    expect(db.createForDesignVersion).not.toHaveBeenCalled();
    expect(db.createForProperty).not.toHaveBeenCalled();
  });

  // The real case this session added: a floor plan uploaded before any
  // design version or AI job exists - the property itself is the only
  // real ownership context available at that point.
  it("uploads via a real property parent when propertyId is given, with no design version or job required", async () => {
    db.findPropertyContext.mockResolvedValue({
      id: "property-1",
      ownerId: "user-1",
    } as never);
    db.createForProperty.mockResolvedValue({
      objectKey: "real-key",
      contentType: "image/jpeg",
    } as never);

    const result = await assetService.createUpload("user-1", {
      ...baseInput,
      propertyId: "property-1",
    } as never);

    expect(db.createForProperty).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: "property-1" }),
    );
    expect(db.createForDesignVersion).not.toHaveBeenCalled();
    expect(db.createForJob).not.toHaveBeenCalled();
    expect(result.grant.uploadUrl).toBe("https://real-upload-url");
  });

  it("rejects a property-level upload for a property the caller does not own", async () => {
    db.findPropertyContext.mockResolvedValue({
      id: "property-1",
      ownerId: "someone-else",
    } as never);

    await expect(
      assetService.createUpload("user-1", {
        ...baseInput,
        propertyId: "property-1",
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.createForProperty).not.toHaveBeenCalled();
  });

  it("rejects a property-level upload for a property that does not exist", async () => {
    db.findPropertyContext.mockResolvedValue(null);

    await expect(
      assetService.createUpload("user-1", {
        ...baseInput,
        propertyId: "nonexistent-property",
      } as never),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("converts a real BigInt sizeBytes to a plain number - the real fix for a genuine production crash on every real file upload (JSON.stringify throws unconditionally on a raw BigInt, and this app's own upload form always sends a real file size)", async () => {
    db.findPropertyContext.mockResolvedValue({
      id: "property-1",
      ownerId: "user-1",
    } as never);
    db.createForProperty.mockResolvedValue({
      objectKey: "real-key",
      contentType: "image/jpeg",
      sizeBytes: 2_500_000n,
    } as never);

    const result = await assetService.createUpload("user-1", {
      ...baseInput,
      propertyId: "property-1",
      sizeBytes: 2_500_000,
    } as never);

    expect(result.asset.sizeBytes).toBe(2_500_000);
    expect(typeof result.asset.sizeBytes).toBe("number");
  });

  it("real, explicit null sizeBytes stays null rather than becoming NaN", async () => {
    db.findPropertyContext.mockResolvedValue({
      id: "property-1",
      ownerId: "user-1",
    } as never);
    db.createForProperty.mockResolvedValue({
      objectKey: "real-key",
      contentType: "image/jpeg",
      sizeBytes: null,
    } as never);

    const result = await assetService.createUpload("user-1", {
      ...baseInput,
      propertyId: "property-1",
    } as never);

    expect(result.asset.sizeBytes).toBeNull();
  });
});

describe("assetService.createDownloadUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.mockReturnValue({
      createUploadGrant: vi.fn(),
      createDownloadUrl: vi.fn().mockResolvedValue("https://real-signed-url"),
    });
  });

  it("converts a real BigInt sizeBytes to a plain number here too - the same real fix for the download-url route, which serializes the asset the same way", async () => {
    db.findById.mockResolvedValue({
      id: "asset-1",
      objectKey: "real-key",
      sizeBytes: 2_500_000n,
    } as never);

    const result = await assetService.createDownloadUrl("asset-1", "user-1");

    expect(result.asset.sizeBytes).toBe(2_500_000);
    expect(typeof result.asset.sizeBytes).toBe("number");
    expect(result.downloadUrl).toBe("https://real-signed-url");
  });
});
