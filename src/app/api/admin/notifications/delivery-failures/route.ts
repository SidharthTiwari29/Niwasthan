import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { notificationService } from "@/server/services/notificationService";

// README §34: operational monitoring for notification channel delivery.
// Returns real, recent email-delivery failures recorded by
// notificationService.notify (never a synthetic "all clear").
export const GET = withErrorHandling(async () => {
  await requireAdmin();
  const failures = await notificationService.listRecentEmailFailures(50);
  return NextResponse.json({ failures });
});
