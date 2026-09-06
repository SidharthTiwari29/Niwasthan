import { beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { getEnv } from "@/server/config/env";
import { sendEmail } from "./emailService";

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn() },
}));

vi.mock("@/server/config/env", () => ({
  getEnv: vi.fn(),
}));

const mockGetEnv = vi.mocked(getEnv);
const mockCreateTransport = vi.mocked(nodemailer.createTransport);

describe("sendEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws a real, specific error when EMAIL_SERVER is not configured - never silently pretends to send", async () => {
    mockGetEnv.mockReturnValue({
      EMAIL_SERVER: undefined,
      EMAIL_FROM: "no-reply@niwasthan.com",
    } as never);

    await expect(
      sendEmail({
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      }),
    ).rejects.toThrow("EMAIL_NOT_CONFIGURED");
  });

  it("throws the same real, specific error when EMAIL_FROM is not configured", async () => {
    mockGetEnv.mockReturnValue({
      EMAIL_SERVER: "smtp://real-server",
      EMAIL_FROM: undefined,
    } as never);

    await expect(
      sendEmail({
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      }),
    ).rejects.toThrow("EMAIL_NOT_CONFIGURED");
  });

  it("sends a real email via the configured SMTP transport, using EMAIL_FROM as the default real sender", async () => {
    mockGetEnv.mockReturnValue({
      EMAIL_SERVER: "smtp://real-server",
      EMAIL_FROM: "no-reply@niwasthan.com",
    } as never);
    const sendMail = vi.fn().mockResolvedValue({});
    mockCreateTransport.mockReturnValue({ sendMail } as never);

    await sendEmail({
      to: "customer@example.com",
      subject: "Real subject",
      html: "<p>Real body</p>",
      text: "Real body",
    });

    expect(mockCreateTransport).toHaveBeenCalledWith("smtp://real-server");
    expect(sendMail).toHaveBeenCalledWith({
      to: "customer@example.com",
      from: "no-reply@niwasthan.com",
      subject: "Real subject",
      html: "<p>Real body</p>",
      text: "Real body",
    });
  });

  it("uses a real, explicitly-given sender instead of the default when one is provided", async () => {
    mockGetEnv.mockReturnValue({
      EMAIL_SERVER: "smtp://real-server",
      EMAIL_FROM: "no-reply@niwasthan.com",
    } as never);
    const sendMail = vi.fn().mockResolvedValue({});
    mockCreateTransport.mockReturnValue({ sendMail } as never);

    await sendEmail({
      to: "founder@niwasthan.com",
      from: "reports@niwasthan.com",
      subject: "Real subject",
      html: "<p>Real body</p>",
      text: "Real body",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "reports@niwasthan.com" }),
    );
  });
});
