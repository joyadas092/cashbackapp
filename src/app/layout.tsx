import type { Metadata } from "next";
import "./globals.css";

import { siteUrl } from "@/lib/siteUrl";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

/**
 * Built per request so the admin's SEO settings apply without a redeploy.
 * Falls back to the defaults in src/lib/settings.ts if the database is
 * unreachable — a metadata lookup must never take the whole site down.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => DEFAULT_SETTINGS);

  return {
    // Without this, every relative canonical/OG url a page declares is dropped.
    metadataBase: new URL(siteUrl()),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.seoDescription,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
