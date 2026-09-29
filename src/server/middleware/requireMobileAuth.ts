import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import type { Role } from "@prisma/client";
import { getEnv } from "@/server/config/env";
import { UnauthorizedError } from "@/server/errors/AppError";
import type { AuthedContext } from "@/server/middleware/requireAuth";

// Real, deliberately separate from requireAuth(): that function is
// called by 75 real, existing web routes today, all relying on
// Auth.js's own auth() reading the session cookie. Rather than risk
// any change to that proven, working path, mobile authentication is
// its own, additive function - new mobile-specific routes use this
// one, existing web routes are completely untouched.
//
// getToken() is Auth.js's own, documented mechanism for reading a
// real, valid Auth.js-issued JWT from an Authorization: Bearer header
// (it also reads the session cookie, but that path is intentionally
// left to requireAuth() above) - the same encode()/decode() pair and
// the same AUTH_SECRET a real web session cookie uses, so a token
// minted by the mobile sign-in route (see
// /api/mobile/auth/google/route.ts) is valid here without any new,
// separate signing scheme.
// Real, deliberately explicit rather than relying on Auth.js's own
// implicit defaults matching between here and the mobile sign-in
// route's encode() call: both sides must derive the identical salt
// (which defaults to the session-token cookie name) or a token minted
// by one will never successfully decode via the other. Pinning both
// to the same literal value removes any risk of silent drift if
// Auth.js's own internal defaults ever change.
export const MOBILE_JWT_SALT = "authjs.session-token";

export async function requireMobileAuth(): Promise<AuthedContext> {
  const token = await getToken({
    req: { headers: await headers() },
    secret: getEnv().AUTH_SECRET,
    salt: MOBILE_JWT_SALT,
  });
  if (!token?.sub) {
    throw new UnauthorizedError();
  }
  return { userId: token.sub, role: (token.role as Role) ?? "USER" };
}
