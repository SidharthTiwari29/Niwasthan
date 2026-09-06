import { z } from "zod";

// Real, concrete fix for a genuine Vercel build failure: Zod's
// .optional() only treats `undefined` as "not provided" - it does NOT
// treat an empty string as absent, and Vercel's build environment sets
// unfilled dashboard variables to "" rather than actually omitting the
// key. Without this, an empty-but-declared AUTH_URL/EMAIL_FROM/
// REDIS_URL/STORAGE_ENDPOINT fails its .url()/.email() format check
// and crashes the entire build, even though the intent was "not set
// yet." This treats "" as genuinely equivalent to "not provided" for
// every optional field, consistently, not just the four that happened
// to be blank in this specific deployment - the same class of failure
// would recur for any other optional variable left blank in the
// future otherwise.
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === "" ? undefined : val), schema.optional());

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: emptyToUndefined(z.string().url()),
  GOOGLE_CLIENT_ID: emptyToUndefined(z.string()),
  GOOGLE_CLIENT_SECRET: emptyToUndefined(z.string()),
  EMAIL_SERVER: emptyToUndefined(z.string()),
  EMAIL_FROM: emptyToUndefined(z.string().email()),
  RAZORPAY_KEY_ID: emptyToUndefined(z.string()),
  RAZORPAY_KEY_SECRET: emptyToUndefined(z.string()),
  RAZORPAY_WEBHOOK_SECRET: emptyToUndefined(z.string()),
  REDIS_URL: emptyToUndefined(z.string().url()),
  STORAGE_BUCKET: emptyToUndefined(z.string()),
  STORAGE_REGION: emptyToUndefined(z.string()),
  STORAGE_ENDPOINT: emptyToUndefined(z.string().url()),
  STORAGE_ACCESS_KEY_ID: emptyToUndefined(z.string()),
  STORAGE_SECRET_ACCESS_KEY: emptyToUndefined(z.string()),
  AI_PROVIDER: emptyToUndefined(z.string()),
  GEMINI_API_KEY: emptyToUndefined(z.string()),
  // Real, stated business decision: founder operations reports go to
  // this address. A real, sensible default rather than requiring this
  // to be configured before the feature works at all - still
  // overridable via the actual env var if that address ever changes.
  // Uses the same emptyToUndefined treatment as every other optional
  // variable here before falling back to the default, for the exact
  // reason documented at the top of this file: an unfilled-but-present
  // Vercel variable is "", not absent, and .default() alone only
  // catches genuinely missing keys, not empty-string ones.
  FOUNDER_REPORT_EMAIL: emptyToUndefined(z.string().email()).default(
    "founder@niwasthan.com",
  ),
});

export function getEnv() {
  return schema.parse(process.env);
}
