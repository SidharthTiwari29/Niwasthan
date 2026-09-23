import { prisma } from "@/server/db/prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors/AppError";
import { assetService } from "./assetService";
import { getStorageProvider } from "@/server/storage/provider";
import type { CreateAssetInput } from "@/server/validators/asset";

type Range = { start: number; end: number };

type SessionWithAsset = {
  expectedBytes: bigint | null;
  asset: { objectKey: string; contentType: string };
  [key: string]: unknown;
};

function normalizeRanges(value: unknown): Range[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Range =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Range).start === "number" &&
        typeof (item as Range).end === "number" &&
        Number.isInteger((item as Range).start) &&
        Number.isInteger((item as Range).end) &&
        (item as Range).start >= 0 &&
        (item as Range).end >= (item as Range).start,
    )
    .sort((a, b) => a.start - b.start)
    .reduce<Range[]>((merged, current) => {
      const previous = merged.at(-1);
      if (previous && current.start <= previous.end + 1)
        previous.end = Math.max(previous.end, current.end);
      else merged.push({ ...current });
      return merged;
    }, []);
}

function isCovered(ranges: Range[], expectedBytes: number | null): boolean {
  return (
    expectedBytes !== null &&
    ranges.length > 0 &&
    ranges[0].start === 0 &&
    ranges[0].end + 1 >= expectedBytes
  );
}

function serializeSession<T extends SessionWithAsset>(session: T) {
  return {
    ...session,
    expectedBytes:
      session.expectedBytes === null ? null : Number(session.expectedBytes),
  };
}

async function getOwned(id: string, userId: string) {
  const session = await prisma.uploadSession.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!session) throw new NotFoundError("Upload session");
  if (session.userId !== userId) throw new ForbiddenError();
  if (
    session.status !== "COMPLETED" &&
    session.status !== "CANCELLED" &&
    session.expiresAt <= new Date()
  ) {
    return prisma.uploadSession.update({
      where: { id },
      data: { status: "EXPIRED" },
      include: { asset: true },
    });
  }
  return session;
}

async function withGrant(session: SessionWithAsset) {
  const grant = await getStorageProvider().createUploadGrant({
    objectKey: session.asset.objectKey,
    contentType: session.asset.contentType,
    expiresInSeconds: 600,
  });
  return { session: serializeSession(session), grant };
}

export const uploadSessionService = {
  async create(
    userId: string,
    input: CreateAssetInput & {
      idempotencyKey: string;
      expiresInSeconds?: number;
    },
  ) {
    const existing = await prisma.uploadSession.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey },
      },
      include: { asset: true },
    });
    if (existing) return withGrant(existing);
    const { idempotencyKey, expiresInSeconds = 900, ...assetInput } = input;
    const created = await assetService.createUpload(userId, assetInput);
    const session = await prisma.uploadSession.create({
      data: {
        userId,
        assetId: created.asset.id,
        idempotencyKey,
        expectedBytes:
          input.sizeBytes === undefined ? undefined : BigInt(input.sizeBytes),
        expectedChecksum: input.checksum,
        uploadedRanges: [],
        expiresAt: new Date(
          Date.now() + Math.min(Math.max(expiresInSeconds, 60), 900) * 1000,
        ),
      },
      include: { asset: true },
    });
    return { session: serializeSession(session), grant: created.grant };
  },
  async get(id: string, userId: string) {
    return serializeSession(await getOwned(id, userId));
  },
  async recordRange(id: string, userId: string, range: Range) {
    const session = await getOwned(id, userId);
    if (["EXPIRED", "CANCELLED", "COMPLETED"].includes(session.status))
      return serializeSession(session);
    const ranges = normalizeRanges([
      ...normalizeRanges(session.uploadedRanges),
      range,
    ]);
    return serializeSession(
      await prisma.uploadSession.update({
        where: { id },
        data: { uploadedRanges: ranges, status: "UPLOADING" },
        include: { asset: true },
      }),
    );
  },
  async complete(
    id: string,
    userId: string,
    input: { clientChecksum?: string },
  ) {
    const session = await getOwned(id, userId);
    if (["EXPIRED", "CANCELLED"].includes(session.status))
      return serializeSession(session);
    const expectedBytes =
      session.expectedBytes === null ? null : Number(session.expectedBytes);
    const checksumMatches =
      !session.expectedChecksum ||
      !input.clientChecksum ||
      session.expectedChecksum === input.clientChecksum;
    const status =
      isCovered(normalizeRanges(session.uploadedRanges), expectedBytes) &&
      checksumMatches
        ? "CLIENT_VERIFIED"
        : "UNKNOWN";
    return serializeSession(
      await prisma.uploadSession.update({
        where: { id },
        data: {
          status,
          completedAt: status === "CLIENT_VERIFIED" ? new Date() : null,
        },
        include: { asset: true },
      }),
    );
  },
  async cancel(id: string, userId: string) {
    await getOwned(id, userId);
    return serializeSession(
      await prisma.uploadSession.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { asset: true },
      }),
    );
  },
};

export { normalizeRanges, isCovered };
