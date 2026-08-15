import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashbackApp — Shop Smarter. Get Cashback. Earn More.",
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
