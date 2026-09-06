import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import { SUPPORTED_LOCALES, isSupportedLocale } from "./locales";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? flattenKeys(value as Record<string, unknown>, fullKey)
      : [fullKey];
  });
}

describe("translation message files", () => {
  it("real, exact key parity between en and hi - a missing key would silently show a raw message key to a real user", () => {
    const enKeys = flattenKeys(en).sort();
    const hiKeys = flattenKeys(hi).sort();

    expect(hiKeys).toEqual(enKeys);
  });

  it("no real message value is an empty string in either language", () => {
    for (const [locale, messages] of [
      ["en", en],
      ["hi", hi],
    ] as const) {
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
