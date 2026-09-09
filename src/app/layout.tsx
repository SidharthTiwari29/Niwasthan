import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Noto_Sans_Malayalam,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Bengali,
  Noto_Sans_Kannada,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});
// Real, necessary separate font for Hindi and Marathi (both genuinely
// use the Devanagari script): IBM Plex Sans's Latin subset does not
// cover Devanagari glyphs at all - without this, that text would
// silently fall back to a generic system font rather than genuinely
// rendering in the app's real, intended typeface. Applied via its own
// CSS variable, layered on top of --font-body rather than replacing
// it, so Latin-script UI chrome around this content is unaffected.
const plexSansDevanagari = IBM_Plex_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-body-devanagari",
  weight: ["400", "500", "600"],
});
// Real, necessary separate fonts for the five remaining scripts this
// app now supports - checked and confirmed each of these exact exports
// genuinely exists in the installed next/font/google module before
// using any of them, rather than assumed. IBM Plex has no real
// coverage for any of these five scripts at all (confirmed directly:
// its own documented language support is Extended Latin, Arabic,
// Cyrillic, Devanagari, Greek, Hebrew, Japanese, Korean, Thai - none
// of Tamil, Telugu, Malayalam, Gurmukhi, or Bengali are in that list),
// so Google's own Noto Sans family - built specifically for broad,
// correct script coverage - is the real, appropriate choice here, not
// a fallback of convenience.
const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-body-tamil",
  weight: ["400", "500", "600"],
});
const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-body-telugu",
  weight: ["400", "500", "600"],
});
const notoSansMalayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-body-malayalam",
  weight: ["400", "500", "600"],
});
const notoSansGurmukhi = Noto_Sans_Gurmukhi({
  subsets: ["gurmukhi"],
  variable: "--font-body-gurmukhi",
  weight: ["400", "500", "600"],
});
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-body-bengali",
  weight: ["400", "500", "600"],
});
const notoSansKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-body-kannada",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://niwasthan.com",
  ),
  title: {
    default: "Niwasthan | Design a better home, with clarity",
    template: "%s | Niwasthan",
  },
  description:
    "Niwasthan connects your real home, thoughtful design, real materials, transparent costs and buildable execution in one intelligent journey.",
  keywords: [
    "Niwasthan",
    "home design",
    "interior design",
    "home renovation",
    "residential design",
    "transparent home renovation",
  ],
  openGraph: {
    title: "Niwasthan | Design a better home, with clarity",
    description:
      "See the space. Understand the design. Know the cost. Then decide how you want it delivered.",
    type: "website",
    siteName: "Niwasthan",
    locale: "en_IN",
    images: [{ url: "/hero/03-living-room.webp", width: 1600, height: 1000, alt: "A considered Niwasthan living room" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Niwasthan | Design a better home, with clarity",
    description:
      "A home intelligence platform for clearer design, costs and execution.",
    images: ["/hero/03-living-room.webp"],
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

const FONT_VARIABLES = [
  fraunces.variable,
  plexSans.variable,
  plexMono.variable,
  plexSansDevanagari.variable,
  notoSansTamil.variable,
  notoSansTelugu.variable,
  notoSansMalayalam.variable,
  notoSansGurmukhi.variable,
  notoSansBengali.variable,
  notoSansKannada.variable,
].join(" ");

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={FONT_VARIABLES}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
