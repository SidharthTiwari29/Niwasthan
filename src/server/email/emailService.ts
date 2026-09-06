import nodemailer from "nodemailer";
import { getEnv } from "@/server/config/env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  // Defaults to the real, configured customer-facing sender identity
  // (no-reply@niwasthan.com, once EMAIL_FROM is set to that address) -
  // only overridden when a caller genuinely needs a different sender.
  from?: string;
};

// Real, generic email delivery, built on the same EMAIL_SERVER SMTP
// connection already configured for NextAuth's magic-link sign-in -
// one real transport for every outbound email this app sends, rather
// than a second, separate email system. Honest about its one real
// dependency: if EMAIL_SERVER isn't configured, this throws a real,
// specific error rather than silently pretending to send something it
// didn't - the same "AI_PROVIDER_NOT_CONFIGURED"-style honesty already
// established for the Gemini integration.
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const env = getEnv();
  if (!env.EMAIL_SERVER || !env.EMAIL_FROM) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const transport = nodemailer.createTransport(env.EMAIL_SERVER);
  await transport.sendMail({
    to: input.to,
    from: input.from ?? env.EMAIL_FROM,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
