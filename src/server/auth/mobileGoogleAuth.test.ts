import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { handleUserCreated } from "@/server/auth/onUserCreated";
import { UnauthorizedError } from "@/server/errors/AppError";
import { resolveMobileGoogleUser } from "./mobileGoogleAuth";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    account: { findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/server/auth/onUserCreated", () => ({
  handleUserCreated: vi.fn(),
}));

vi.mock("@/server/config/env", () => ({
  getEnv: () => ({ GOOGLE_CLIENT_ID: "real-client-id" }),
}));

const db = vi.mocked(prisma, { deep: true });
const mockHandleUserCreated = vi.mocked(handleUserCreated);

function mockGoogleResponse(body: Record<string, unknown>, ok = true) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status: ok ? 200 : 400 }),
  );
}

const validClaims = {
  aud: "real-client-id",
  sub: "google-sub-1",
  email: "user@example.com",
  email_verified: "true",
  name: "Real User",
  picture: "https://example.com/pic.jpg",
};

describe("resolveMobileGoogleUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a real, validly-signed Google token that was not issued for this app - the audience check that makes this genuine authentication", async () => {
    mockGoogleResponse({ ...validClaims, aud: "some-other-real-app" });

    await expect(resolveMobileGoogleUser("token")).rejects.toThrow(
      UnauthorizedError,
    );
    expect(db.account.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a token whose email is not verified", async () => {
    mockGoogleResponse({ ...validClaims, email_verified: "false" });

    await expect(resolveMobileGoogleUser("token")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("rejects when Google's own tokeninfo endpoint reports the token invalid", async () => {
    mockGoogleResponse({ error: "invalid_token" }, false);

    await expect(resolveMobileGoogleUser("token")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("resolves to the exact same real user already linked to this Google identity - never creates a duplicate", async () => {
    mockGoogleResponse(validClaims);
    db.account.findUnique.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    } as never);

    const user = await resolveMobileGoogleUser("token");

    expect(db.account.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: "google-sub-1",
        },
      },
      include: { user: true },
    });
    expect(user).toEqual({ id: "user-1", email: "user@example.com" });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("links a new Google account to a real, existing user found by their verified email - the same person who signed up via magic-link first", async () => {
    mockGoogleResponse(validClaims);
    db.account.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({
      id: "user-2",
      email: "user@example.com",
    } as never);

    const user = await resolveMobileGoogleUser("token");

    expect(db.account.create).toHaveBeenCalledWith({
      data: {
        userId: "user-2",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-sub-1",
      },
    });
    expect(user).toEqual({ id: "user-2", email: "user@example.com" });
    expect(db.user.create).not.toHaveBeenCalled();
    expect(mockHandleUserCreated).not.toHaveBeenCalled();
  });

  it("creates a genuinely new real user and fires the exact same onboarding hook the web signup path uses", async () => {
    mockGoogleResponse(validClaims);
    db.account.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({
      id: "user-3",
      email: "user@example.com",
    } as never);

    const user = await resolveMobileGoogleUser("token");

    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        email: "user@example.com",
        name: "Real User",
        image: "https://example.com/pic.jpg",
      },
    });
    expect(db.account.create).toHaveBeenCalledWith({
      data: {
        userId: "user-3",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-sub-1",
      },
    });
    expect(mockHandleUserCreated).toHaveBeenCalledWith("user-3");
    expect(user).toEqual({ id: "user-3", email: "user@example.com" });
  });
});
