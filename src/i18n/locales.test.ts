import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import mr from "../../messages/mr.json";
import ta from "../../messages/ta.json";
import te from "../../messages/te.json";
import ml from "../../messages/ml.json";
import pa from "../../messages/pa.json";
import bn from "../../messages/bn.json";
import kn from "../../messages/kn.json";
import { SUPPORTED_LOCALES, isSupportedLocale } from "./locales";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? flattenKeys(value as Record<string, unknown>, fullKey)
      : [fullKey];
  });
}

// Real, direct map from every currently-supported locale to its actual
// imported messages file - deliberately not a dynamic import, since
// this needs to run synchronously inside a plain array/loop below, and
// listing them explicitly here means adding a new language elsewhere
// without also adding it here is caught immediately by this test
// failing to find that locale's real messages, not by silently
// skipping it.
const MESSAGES_BY_LOCALE: Record<string, Record<string, unknown>> = {
  en,
  hi,
  mr,
  ta,
  te,
  ml,
  pa,
  bn,
  kn,
};

describe("translation message files", () => {
  it("every real, currently supported locale actually has a messages file wired into this test", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(
        MESSAGES_BY_LOCALE[locale],
        `${locale} is in SUPPORTED_LOCALES but has no messages file checked here`,
      ).toBeDefined();
    }
  });

  it("real, exact key parity across every real, currently supported locale - a missing key would silently show a raw message key to a real user", () => {
    const enKeys = flattenKeys(en).sort();

    for (const locale of SUPPORTED_LOCALES) {
      const keys = flattenKeys(MESSAGES_BY_LOCALE[locale]).sort();
      expect(keys, `${locale} key set should exactly match en`).toEqual(enKeys);
    }
  });

  it("no real message value is an empty string in any currently supported language", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const messages = MESSAGES_BY_LOCALE[locale];
      for (const key of flattenKeys(messages)) {
        const value = key
          .split(".")
          .reduce(
            (obj: unknown, k) => (obj as Record<string, unknown>)[k],
            messages,
          );
        expect(value, `${locale}.${key} should not be empty`).not.toBe("");
      }
    }
  });
});

describe("isSupportedLocale", () => {
  it("accepts every real, currently supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(isSupportedLocale(locale)).toBe(true);
    }
  });

  it("rejects a real, genuinely unsupported locale string", () => {
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
  });
});
