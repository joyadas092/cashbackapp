import { Coins, Gift, IndianRupee, UserPlus, Users } from "lucide-react";

/**
 * Hero artwork for the public Refer & Earn page.
 *
 * The reference uses a rendered 3D illustration, which can't be produced as
 * code. This builds the same idea out of markup instead — the big rate badge,
 * a ring of joining friends, and scattered confetti — so it stays crisp at any
 * density and picks up the live rate rather than baking a number into a PNG.
 * Purely decorative, so it is hidden from assistive tech.
 */
export function ReferHeroArt({ ratePct }: { ratePct: number | null }) {
  const friends = [
    { top: "12%", left: "6%", tint: "bg-violet-100 text-violet-600", delay: "0s" },
    { top: "40%", left: "0%", tint: "bg-cyan-100 text-cyan-600", delay: "0.8s" },
    { top: "10%", right: "8%", tint: "bg-amber-100 text-amber-600", delay: "1.4s" },
    { top: "46%", right: "1%", tint: "bg-rose-100 text-rose-600", delay: "2s" },
  ];

  const confetti = [
    { top: "6%", left: "30%", tint: "bg-violet-400", size: "h-2 w-2", rotate: "rotate-12" },
    { top: "18%", left: "52%", tint: "bg-amber-400", size: "h-2.5 w-1.5", rotate: "-rotate-12" },
    { top: "4%", left: "68%", tint: "bg-cyan-400", size: "h-2 w-2", rotate: "rotate-45" },
    { top: "30%", left: "22%", tint: "bg-rose-400", size: "h-1.5 w-1.5", rotate: "rotate-12" },
    { top: "62%", left: "14%", tint: "bg-cashlime-400", size: "h-2 w-2", rotate: "-rotate-45" },
    { top: "70%", left: "70%", tint: "bg-violet-300", size: "h-2.5 w-1.5", rotate: "rotate-12" },
    { top: "52%", left: "82%", tint: "bg-amber-300", size: "h-2 w-2", rotate: "-rotate-12" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      {/* Soft disc behind everything */}
      <div className="absolute inset-[12%] rounded-full bg-violet-200/45 blur-[2px]" />
      <div className="absolute inset-[22%] rounded-full bg-violet-100/60" />

      {/* Confetti */}
      {confetti.map((bit, i) => (
        <span
          key={i}
          className={`absolute rounded-[2px] ${bit.tint} ${bit.size} ${bit.rotate} motion-safe:animate-float`}
          style={{ top: bit.top, left: bit.left, animationDelay: `${i * 0.4}s` }}
        />
      ))}

      {/* Rate badge */}
      <div className="absolute right-[6%] top-[2%] flex h-36 w-36 flex-col items-center justify-center rounded-full bg-violet-600 text-center text-white shadow-2xl shadow-violet-600/40 sm:h-44 sm:w-44">
        <span className="text-xs font-semibold tracking-wide sm:text-sm">GET</span>
        <span className="text-4xl font-extrabold leading-none sm:text-5xl">
          {ratePct !== null ? `${ratePct}%` : "₹"}
        </span>
        <span className="text-[10px] font-semibold tracking-wide sm:text-xs">
          {ratePct !== null ? "OF INCOME" : "REWARDS"}
        </span>
      </div>

      {/* Friends joining */}
      {friends.map((friend, i) => (
        <span
          key={i}
          className="absolute motion-safe:animate-float"
          style={{
            top: friend.top,
            left: friend.left,
            right: friend.right,
            animationDelay: friend.delay,
          }}
        >
          <span className="relative block">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-lg ${friend.tint}`}
            >
              <Users size={22} strokeWidth={1.75} />
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
              <UserPlus size={12} strokeWidth={2.5} />
            </span>
          </span>
        </span>
      ))}

      {/* Centre cluster: the reward itself */}
      <div className="absolute inset-x-0 bottom-[14%] flex items-end justify-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-lg motion-safe:animate-float">
          <Coins size={28} strokeWidth={1.75} />
        </span>
        <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-600 text-white shadow-xl shadow-violet-600/30">
          <Gift size={44} strokeWidth={1.5} />
        </span>
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cashlime-100 text-cashlime-700 shadow-lg motion-safe:animate-float"
          style={{ animationDelay: "1.2s" }}
        >
          <IndianRupee size={26} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}
