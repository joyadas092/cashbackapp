import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "CashbackApp — Shop Smarter. Get Cashback. Earn More.",
  description:
    "Shop your favourite stores, get real cashback, and earn extra by sharing deals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-hero-gradient bg-fixed">
        <Header />
        <main className="pb-20 sm:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
