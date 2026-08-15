import Link from "next/link";
import { cn } from "@/lib/utils";

export function SidebarNavItem({
  href,
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/25"
        title="Coming in a later phase"
      >
        <span className="text-base leading-none">{icon}</span>
        {label}
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-violet-400 bg-violet-500/15 text-white"
          : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </Link>
  );
}
