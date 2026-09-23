import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEnv } from "./env";

const REQUIRED_BASE = {
  DATABASE_URL: "postgresql://user:pass@host:5432/db",
  AUTH_SECRET: "a".repeat(32),
};

describe("getEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...REQUIRED_BASE, NODE_ENV: "test" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses successfully with only the required fields set", () => {
    expect(() => getEnv()).not.toThrow();
  });

  // The exact real bug from the Vercel build failure: an optional
  // URL/email field left blank in the dashboard arrives as an empty
  // string, not as a genuinely missing key - this must never crash the
  // build the way it did before this fix.
  it("does not throw when AUTH_URL, EMAIL_FROM, REDIS_URL, or STORAGE_ENDPOINT are empty strings", () => {
    process.env.AUTH_URL = "";
    process.env.EMAIL_FROM = "";
    process.env.REDIS_URL = "";
    process.env.STORAGE_ENDPOINT = "";

    const env = getEnv();

    expect(env.AUTH_URL).toBeUndefined();
    expect(env.EMAIL_FROM).toBeUndefined();
    expect(env.REDIS_URL).toBeUndefined();
    expect(env.STORAGE_ENDPOINT).toBeUndefined();
  });

  it("still rejects a genuinely invalid, non-empty URL - the fix only treats empty as absent, never as a bypass for real validation", () => {
    process.env.AUTH_URL = "not-a-real-url";

    expect(() => getEnv()).toThrow();
  });

  it("still rejects a genuinely invalid, non-empty email address", () => {
    process.env.EMAIL_FROM = "not-an-email";

    expect(() => getEnv()).toThrow();
  });

  it("accepts a genuinely valid URL and email when they are actually provided", () => {
    process.env.AUTH_URL = "https://niwasthan.com";
    process.env.EMAIL_FROM = "support@niwasthan.com";

    const env = getEnv();

    expect(env.AUTH_URL).toBe("https://niwasthan.com");
    expect(env.EMAIL_FROM).toBe("support@niwasthan.com");
  });

  it("still requires DATABASE_URL and rejects an empty value for it - required fields are not affected by this fix", () => {
    process.env.DATABASE_URL = "";

    expect(() => getEnv()).toThrow();
  });

  it("does not throw when CRON_SECRET is unset or an empty string - not every environment runs cron", () => {
    delete process.env.CRON_SECRET;
    expect(() => getEnv()).not.toThrow();
    expect(getEnv().CRON_SECRET).toBeUndefined();

    process.env.CRON_SECRET = "";
    expect(() => getEnv()).not.toThrow();
    expect(getEnv().CRON_SECRET).toBeUndefined();
  });

  it("accepts a genuinely provided CRON_SECRET of real minimum length", () => {
    process.env.CRON_SECRET = "a".repeat(16);

    expect(getEnv().CRON_SECRET).toBe("a".repeat(16));
  });

  it("rejects a real but too-short CRON_SECRET rather than silently accepting a weak one", () => {
    process.env.CRON_SECRET = "short";

    expect(() => getEnv()).toThrow();
  });
});
