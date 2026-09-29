import { NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handler";
import { requireMobileAuth } from "@/server/middleware/requireMobileAuth";
import { prisma } from "@/server/db/prisma";
import { NotFoundError } from "@/server/errors/AppError";

// Real, minimal identity check the mobile app calls on launch to
// verify a stored token is still genuinely valid, not just present -
// a token can be expired or the account since removed, and this is
// the real, authoritative source rather than trusting local storage.
export const GET = withErrorHandling(async () => {
  const { userId } = await requireMobileAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw new NotFoundError("User");
  return NextResponse.json({ user });
});
