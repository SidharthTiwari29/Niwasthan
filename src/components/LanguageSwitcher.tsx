"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { SUPPORTED_LOCALES, LOCALE_COOKIE_NAME } from "@/i18n/locales";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  bn: "বাংলা",
  kn: "ಕನ್ನಡ",
};

// Real, deliberately minimal implementation matching the actual
// non-prefixed-routing architecture chosen for this app: setting a
// cookie and refreshing the current page, rather than navigating to a
// different URL - no route ever needs to change for the language to
// change, which is exactly why this approach avoids restructuring
// every existing page under a /[locale]/ segment.
export function LanguageSwitcher() {
  const router = useRouter();
  const activeLocale = useLocale();

  function handleChange(locale: string) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <select
      value={activeLocale}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Language"
      className="rounded-sm border border-paper-raised bg-transparent px-2 py-1 font-body text-xs text-ink-soft outline-none hover:border-laterite hover:text-ink"
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale] ?? locale}
        </option>
      ))}
    </select>
  );
}
