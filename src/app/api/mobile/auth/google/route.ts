import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { withErrorHandling } from "@/server/errors/handler";
import { parseOrThrow } from "@/server/validators/parse";
import { z } from "zod";
import { getEnv } from "@/server/config/env";
import { resolveMobileGoogleUser } from "@/server/auth/mobileGoogleAuth";
import { MOBILE_JWT_SALT } from "@/server/middleware/requireMobileAuth";
import { consumeRateLimit } from "@/server/security/rateLimit";
import type { Role } from "@prisma/client";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

// Real, previously-missing entry point: the mobile app has never had
// any way to authenticate against this backend at all - every existing
// route relies on a browser session cookie a native app simply cannot
// present. This exchanges a real Google ID token (obtained natively on
// the device, verified here against Google's own tokeninfo endpoint,
// audience-checked against this app's real GOOGLE_CLIENT_ID) for a
// real Auth.js-issued JWT the mobile app then sends as a Bearer token
// on every subsequent request - the exact same token format and
// secret a web session cookie uses, verified by requireMobileAuth's
// own getToken() call.
export const POST = withErrorHandling(async (request: Request) => {
  await consumeRateLimit({
    key: `mobile-auth:${request.headers.get("x-forwarded-for") ?? "unknown"}`,
    limit: 10,
    windowSeconds: 60,
  });
  const { idToken } = parseOrThrow(bodySchema, await request.json());
  const user = await resolveMobileGoogleUser(idToken);

  const jwt = await encode({
    secret: getEnv().AUTH_SECRET,
    salt: MOBILE_JWT_SALT,
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      role: user.role as Role,
    },
    // Real, deliberately shorter than Auth.js's own 30-day web default:
    // a mobile token that can be silently used for a full month without
    // the user ever re-authenticating is a real, unnecessary risk for a
    // device that can be lost or shared. 14 days balances genuine
    // convenience against that real exposure window.
    maxAge: 14 * 24 * 60 * 60,
  });

  return NextResponse.json({
    token: jwt,
    user: { id: user.id, email: user.email, name: user.name },
  });
});
