import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
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
// Real, necessary separate font for Hindi (and any future Devanagari-
// script language): IBM Plex Sans's Latin subset does not cover
// Devanagari glyphs at all - without this, Hindi text would silently
// fall back to a generic system font rather than genuinely rendering
// in the app's real, intended typeface. Applied via its own CSS
// variable, layered on top of --font-body rather than replacing it, so
// Latin-script UI chrome around Hindi content is unaffected.
const plexSansDevanagari = IBM_Plex_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-body-devanagari",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Niwasthan | A better way to build home",
    template: "%s | Niwasthan",
  },
  description:
    "Explore your home, understand the design, see the budget relationship and decide how you want it delivered with Niwasthan.",
  keywords: [
    "Niwasthan",
    "home design",
    "interior design",
    "home renovation",
    "residential design",
    "transparent home renovation",
  ],
  openGraph: {
    title: "Niwasthan | A better way to build home",
    description:
      "See the space. Understand the design. Know the cost. Then decide how you want it delivered.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} ${plexSansDevanagari.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
