import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE, parseLang } from "@/lib/constants";
import { I18nProvider } from "@/i18n/provider";
import "./globals.css";

// Inter is a variable font here, so intermediate weights such as 510 and 590 (see DESIGN.md) render as designed.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Every page is rendered per request: the Content-Security-Policy nonce (src/middleware.ts) only reaches pages
// that are not prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Tenant Console", template: "%s · Tenant Console" },
  description: "Admin console for a multi-tenant API.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const lang = parseLang(jar.get(COOKIE.lang)?.value);
  return (
    <html lang={lang} className={`${inter.variable} ${mono.variable}`}>
      <body>
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
