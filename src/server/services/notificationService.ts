import { NotFoundError } from "@/server/errors/AppError";
import { notificationRepository } from "@/server/repositories/notificationRepository";
import { sendEmail } from "@/server/email/emailService";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const notificationService = {
  // Deliberately does not throw on failure to create a notification - a
  // notification is a side effect of some other operation (an order
  // shipped, a quote arrived) and must never cause that primary operation
  // to fail just because the notification write had a problem. Callers
  // fire-and-forget this; errors are swallowed here, not propagated.
  //
  // README §34: a notification is also a "channel delivery" event, not
  // only an in-app row. After the in-app notification is persisted, this
  // makes one real, best-effort attempt to deliver the same event over
  // email (reusing the SMTP transport already configured for sign-in),
  // and records the genuine outcome (SENT/FAILED/SKIPPED) on the
  // notification row itself for operational monitoring - never a
  // fabricated "delivered".
  async notify(input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const created = await notificationRepository
      .create(input)
      .catch(() => null);
    // Intentionally swallowed - see comment above.
    if (!created) return;

    try {
      const recipient = await notificationRepository.getRecipientEmail(
        input.userId,
      );
      if (!recipient?.email) {
        await notificationRepository.markEmailSkipped(
          created.id,
          "Recipient has no email on file",
        );
        return;
      }

      await sendEmail({
        to: recipient.email,
        subject: input.title,
        text: input.message,
        html: `<p>${escapeHtml(input.message)}</p>`,
      });
      await notificationRepository.markEmailSent(created.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown email delivery error";
      // EMAIL_NOT_CONFIGURED is an environment fact, not a real delivery
      // failure - record it distinctly so operational monitoring doesn't
      // confuse "nobody set up SMTP yet" with "SMTP is broken".
      if (message === "EMAIL_NOT_CONFIGURED") {
        await notificationRepository
          .markEmailSkipped(created.id, message)
          .catch(() => undefined);
        return;
      }
      await notificationRepository
        .markEmailFailed(created.id, message)
        .catch(() => undefined);
    }
  },

  list(userId: string, unreadOnly: boolean) {
    return notificationRepository.listForUser(userId, unreadOnly);
  },

  async markRead(notificationId: string, userId: string) {
    const result = await notificationRepository.markRead(
      notificationId,
      userId,
    );
    if (result.count === 0) throw new NotFoundError("Notification");
  },

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },

  // Operational monitoring (README §34).
  listRecentEmailFailures(limit = 50) {
    return notificationRepository.listRecentEmailFailures(limit);
  },
};
