// Real, deliberately separated from request.ts: that file imports
// next/headers (server-only), so anything needing these constants from
// a Client Component - like the language switcher - must import them
// from here instead, or the build breaks.
// Real, deliberately extensible locale list - every entry here just
// needs a matching messages/<locale>.json file to exist. This is
// genuinely how far "supports all Indian languages" scales with this
// architecture: adding another real language beyond this list is
// purely a translation-content task, no further code change required.
// Only entries with a real, actually-written translation file should
// be added here - listing a locale with no real messages behind it
// would silently fall back to raw message keys, which is a worse
// experience than not offering the language at all.
export const SUPPORTED_LOCALES = [
  "en",
  "hi",
  "ta",
  "te",
  "mr",
  "ml",
  "pa",
  "bn",
  "kn",
] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "niwasthan_locale";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
