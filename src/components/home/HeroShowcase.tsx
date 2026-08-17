import { ArrowRight } from "lucide-react";
import { formatInr } from "@/lib/utils";

export interface ShowcaseLogo {
  name: string;
  logoUrl: string;
}

/**
 * Hero artwork: a phone mockup plus brand-logo chips orbiting it. Built in
 * markup rather than as an image so it stays crisp at any density and reuses
 * the real seeded store logos. Decorative — hidden from assistive tech and
 * below lg, where the hero is copy + CTAs only.
 */
export function HeroShowcase({
  totalPaid,
  pending,
  logos,
}: {
  totalPaid: number;
  pending: number;
  logos: ShowcaseLogo[];
}) {
  // Fixed offsets so the chips sit in a deliberate arc, not a random scatter.
  const positions = [
    "right-2 top-6",
    "right-0 top-1/3",
    "-right-2 top-1/2",
    "right-4 bottom-10",
  ];

  return (
    <div className="relative hidden lg:block" aria-hidden>
      <div className="relative mx-auto w-[300px]">
        {/* Glow behind the device */}
        <div className="absolute -inset-8 rounded-full bg-violet-600/20 blur-3xl" />

        {/* Phone */}
        <div className="relative rounded-[2.25rem] border border-white/15 bg-navy-950/80 p-2.5 shadow-2xl backdrop-blur">
          <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-violet-600 to-violet-700 p-4">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/70">
              <span>9:41</span>
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-lg">
              <div className="text-[11px] font-medium text-slate-500">Total Earnings</div>
              <div className="text-2xl font-extrabold text-slate-900">{formatInr(totalPaid)}</div>

              <div className="mt-3 text-[11px] font-medium text-slate-500">Pending Earnings</div>
              <div className="text-lg font-bold text-amber-600">{formatInr(pending)}</div>

              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 text-[11px] font-semibold text-violet-700">
                View Dashboard
                <ArrowRight size={12} strokeWidth={2.5} />
              </div>
            </div>

            {/* Earnings toast */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-lg">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cashlime-50 text-[11px] font-bold text-cashlime-700">
                ₹
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-900">Cashback confirmed</div>
                <div className="truncate text-[10px] text-slate-500">Added to your wallet</div>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-cashlime-700">+₹250</span>
            </div>
          </div>
        </div>

        {/* Floating brand chips */}
        {logos.slice(0, 4).map((logo, i) => (
          <span
            key={logo.name}
            className={`absolute ${positions[i]} flex h-14 w-14 translate-x-1/2 items-center justify-center rounded-full bg-white shadow-xl motion-safe:animate-float`}
            style={{ animationDelay: `${i * 0.6}s` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.logoUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
