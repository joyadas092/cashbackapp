import type { Metadata } from "next";
import "./globals.css";

import { siteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  // Without this, every relative canonical/OG url a page declares is dropped.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "CashbackApp — Shop Smarter. Get Cashback. Earn More.",
    template: "%s | CashbackApp",
  },
  description:
    "Shop your favourite stores, get real cashback, and earn extra by sharing deals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
