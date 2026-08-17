import Link from "next/link";
import { Link2, Lock, ShoppingBag, type LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/shared/LogoMark";
import { PhoneMockupIllustration } from "./PhoneMockupIllustration";

const FEATURES: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: ShoppingBag,
    title: "Best Deals from Top Stores",
    body: "Flipkart, Amazon, Myntra & more",
  },
  { icon: Link2, title: "Earn Extra by Sharing", body: "Turn product links into earning links" },
  { icon: Lock, title: "Track Everything", body: "Clicks, earnings & withdrawals" },
];

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left chrome panel */}
      <div className="relative hidden flex-col justify-center overflow-hidden bg-chrome-gradient px-10 py-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-2 text-2xl font-extrabold text-white">
          <LogoMark size={32} />
          Cashback<span className="text-cashlime-400">.</span>
        </Link>
        <p className="relative mt-1 text-sm text-white/50">Earn More, Save More</p>

        <div className="relative mt-8 flex justify-center">
          <PhoneMockupIllustration />
        </div>

        <ul className="relative mt-10 space-y-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                <f.icon size={17} strokeWidth={1.75} />
              </span>
              <div>
                <div className="text-sm font-semibold text-white">{f.title}</div>
                <div className="text-xs text-white/50">{f.body}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 text-xl font-extrabold text-slate-900 lg:hidden"
          >
            <LogoMark size={26} />
            Cashback<span className="text-cashlime-700">.</span>
          </Link>
          {children}
          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock size={13} strokeWidth={2} />
            Your data is safe and secure with us
          </p>
        </div>
      </div>
    </div>
  );
}
