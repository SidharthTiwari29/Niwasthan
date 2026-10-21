import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/server/errors/AppError";
import { notificationRepository } from "@/server/repositories/notificationRepository";
import { sendEmail } from "@/server/email/emailService";
import { notificationService } from "./notificationService";

vi.mock("@/server/repositories/notificationRepository", () => ({
  notificationRepository: {
    create: vi.fn(),
    listForUser: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    getRecipientEmail: vi.fn(),
    markEmailSent: vi.fn(),
    markEmailFailed: vi.fn(),
    markEmailSkipped: vi.fn(),
    listRecentEmailFailures: vi.fn(),
  },
}));

vi.mock("@/server/email/emailService", () => ({
  sendEmail: vi.fn(),
}));

const repository = vi.mocked(notificationRepository);
const mockedSendEmail = vi.mocked(sendEmail);

describe("notificationService", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("notify", () => {
    it("swallows repository errors rather than throwing, since a notification is a side effect", async () => {
      repository.create.mockRejectedValue(new Error("db unavailable"));

      await expect(
        notificationService.notify({
          userId: "user-1",
          type: "GENERAL",
          title: "Test",
          message: "Test message",
        }),
      ).resolves.toBeUndefined();

      expect(repository.getRecipientEmail).not.toHaveBeenCalled();
    });

    it("creates a notification when the repository succeeds", async () => {
      repository.create.mockResolvedValue({ id: "notif-1" } as never);
      repository.getRecipientEmail.mockResolvedValue({
        email: "owner@example.com",
      } as never);
      mockedSendEmail.mockResolvedValue(undefined);

      await notificationService.notify({
        userId: "user-1",
        type: "GENERAL",
        title: "Test",
        message: "Test message",
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1" }),
      );
    });

    it("sends a genuine email and records SENT when a recipient address exists", async () => {
      repository.create.mockResolvedValue({ id: "notif-1" } as never);
      repository.getRecipientEmail.mockResolvedValue({
        email: "owner@example.com",
      } as never);
      mockedSendEmail.mockResolvedValue(undefined);

      await notificationService.notify({
        userId: "user-1",
        type: "GENERAL",
        title: "Design ready",
        message: "Your design direction is ready to review.",
      });

      expect(mockedSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "owner@example.com",
          subject: "Design ready",
        }),
      );
      expect(repository.markEmailSent).toHaveBeenCalledWith("notif-1");
      expect(repository.markEmailFailed).not.toHaveBeenCalled();
    });

    it("records SKIPPED rather than FAILED when email just isn't configured yet", async () => {
      repository.create.mockResolvedValue({ id: "notif-1" } as never);
      repository.getRecipientEmail.mockResolvedValue({
        email: "owner@example.com",
      } as never);
      mockedSendEmail.mockRejectedValue(new Error("EMAIL_NOT_CONFIGURED"));
      repository.markEmailSkipped.mockResolvedValue(undefined as never);

      await notificationService.notify({
        userId: "user-1",
        type: "GENERAL",
        title: "Test",
        message: "Test message",
      });

      expect(repository.markEmailSkipped).toHaveBeenCalledWith(
        "notif-1",
        "EMAIL_NOT_CONFIGURED",
      );
      expect(repository.markEmailFailed).not.toHaveBeenCalled();
    });

    it("records a genuine FAILED delivery when sending actually errors", async () => {
      repository.create.mockResolvedValue({ id: "notif-1" } as never);
      repository.getRecipientEmail.mockResolvedValue({
        email: "owner@example.com",
      } as never);
      mockedSendEmail.mockRejectedValue(new Error("SMTP connection reset"));
      repository.markEmailFailed.mockResolvedValue(undefined as never);

      await notificationService.notify({
        userId: "user-1",
        type: "GENERAL",
        title: "Test",
        message: "Test message",
      });

      expect(repository.markEmailFailed).toHaveBeenCalledWith(
        "notif-1",
        "SMTP connection reset",
      );
    });

    it("skips email entirely when the recipient has no email on file", async () => {
      repository.create.mockResolvedValue({ id: "notif-1" } as never);
      repository.getRecipientEmail.mockResolvedValue({
        email: null,
      } as never);
      repository.markEmailSkipped.mockResolvedValue(undefined as never);

      await notificationService.notify({
        userId: "user-1",
        type: "GENERAL",
        title: "Test",
        message: "Test message",
      });

      expect(mockedSendEmail).not.toHaveBeenCalled();
      expect(repository.markEmailSkipped).toHaveBeenCalledWith(
        "notif-1",
        "Recipient has no email on file",
      );
    });
  });

  describe("markRead", () => {
    it("rejects marking a notification the caller does not own as read", async () => {
      repository.markRead.mockResolvedValue({ count: 0 });

      await expect(
        notificationService.markRead("notif-1", "user-1"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("marks an owned notification as read", async () => {
      repository.markRead.mockResolvedValue({ count: 1 });

      await expect(
        notificationService.markRead("notif-1", "user-1"),
      ).resolves.toBeUndefined();
    });
  });

  describe("listRecentEmailFailures", () => {
    it("delegates to the repository for operational monitoring", async () => {
      repository.listRecentEmailFailures.mockResolvedValue([]);

      await notificationService.listRecentEmailFailures(50);

      expect(repository.listRecentEmailFailures).toHaveBeenCalledWith(50);
    });
  });
});
