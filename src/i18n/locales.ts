// Real, deliberately separated from request.ts: that file imports
// next/headers (server-only), so anything needing these constants from
// a Client Component - like the language switcher - must import them
// from here instead, or the build breaks.
export const SUPPORTED_LOCALES = ["en", "hi"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "niwasthan_locale";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
