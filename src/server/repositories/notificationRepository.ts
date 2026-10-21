import { prisma } from "@/server/db/prisma";

export const notificationRepository = {
  create(input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    return prisma.notification.create({ data: input as never });
  },

  getRecipientEmail(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
  },

  markEmailSent(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { emailStatus: "SENT", emailSentAt: new Date(), emailError: null },
    });
  },

  markEmailFailed(notificationId: string, error: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { emailStatus: "FAILED", emailError: error.slice(0, 2000) },
    });
  },

  markEmailSkipped(notificationId: string, reason: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { emailStatus: "SKIPPED", emailError: reason.slice(0, 2000) },
    });
  },

  // Operational monitoring (README §34): recent email delivery failures
  // across all users, for an admin to see real, genuine delivery
  // problems rather than assuming the in-app bell was enough.
  listRecentEmailFailures(limit: number) {
    return prisma.notification.findMany({
      where: { emailStatus: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        emailError: true,
        createdAt: true,
      },
    });
  },

  listForUser(userId: string, unreadOnly: boolean) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  // updateMany with userId in the WHERE clause, not a separate ownership
  // check - the same pattern used everywhere else in this codebase, so
  // marking someone else's notification read by guessing its id is
  // structurally impossible, not just policy-forbidden.
  markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },
};
