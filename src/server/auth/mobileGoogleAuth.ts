import { prisma } from "@/server/db/prisma";
import { getEnv } from "@/server/config/env";
import { handleUserCreated } from "@/server/auth/onUserCreated";
import { UnauthorizedError } from "@/server/errors/AppError";

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
};

// Real, security-critical verification: Google's own tokeninfo endpoint
// confirms the ID token is genuinely signed by Google and returns its
// real claims, but it does NOT confirm the token was issued for THIS
// app specifically - a valid Google ID token for a completely
// different application would pass this call just as easily. The
// audience (aud) check below is what actually prevents that: it is
// the one check that makes this real authentication rather than
// merely real-looking authentication.
async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const clientId = getEnv().GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_SIGN_IN_NOT_CONFIGURED");
  }
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!response.ok) {
    throw new UnauthorizedError();
  }
  const info = (await response.json()) as GoogleTokenInfo;
  if (info.aud !== clientId) {
    // A real, genuinely valid Google token - just not one issued for
    // this app. Treated identically to any other invalid credential,
    // not given a more specific error that would help an attacker
    // distinguish "wrong audience" from "not a real token" at all.
    throw new UnauthorizedError();
  }
  if (!info.sub || !info.email || info.email_verified !== "true") {
    throw new UnauthorizedError();
  }
  return info;
}

// Real account resolution, reusing the exact same identity model
// CustomPrismaAdapter uses for web sign-in (an Account row keyed by
// provider + providerAccountId, Google's own real, stable "sub" claim)
// - a customer who has ever signed in via the web app with this same
// Google account resolves to the identical User row here, never a
// duplicate mobile-only account for the same real person.
export async function resolveMobileGoogleUser(idToken: string) {
  const info = await verifyGoogleIdToken(idToken);
  const providerAccountId = info.sub!;
  const email = info.email!;

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider: "google", providerAccountId },
    },
    include: { user: true },
  });
  if (existingAccount) return existingAccount.user;

  // No account linked yet for this Google identity - check whether a
  // real user already exists with this real, verified email (e.g. they
  // signed up via the magic-link email flow first) before creating a
  // genuinely new account, matching the same real-world identity
  // resolution a customer would expect.
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUserByEmail) {
    await prisma.account.create({
      data: {
        userId: existingUserByEmail.id,
        type: "oauth",
        provider: "google",
        providerAccountId,
      },
    });
    return existingUserByEmail;
  }

  const newUser = await prisma.user.create({
    data: { email, name: info.name, image: info.picture },
  });
  await prisma.account.create({
    data: {
      userId: newUser.id,
      type: "oauth",
      provider: "google",
      providerAccountId,
    },
  });
  // Matches the exact real web signup path: fires only for a genuinely
  // new account, never on a returning user linking a second device.
  await handleUserCreated(newUser.id);
  return newUser;
}
