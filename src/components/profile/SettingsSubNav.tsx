import Link from "next/link";
import { Bell, Landmark, ShieldCheck, User, type LucideIcon } from "lucide-react";

const CATEGORIES: Array<{
  key: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  /** Anchor on this page, or undefined for sections that don't exist yet. */
  href?: string;
}> = [
  {
    key: "profile",
    icon: User,
    label: "Profile Settings",
    sub: "Update your personal information",
    href: "#profile",
  },
  {
    key: "security",
    icon: ShieldCheck,
    label: "Account & Security",
    sub: "Change your password",
    href: "#security",
  },
  {
    key: "payout",
    icon: Landmark,
    label: "Bank & Payout Details",
    sub: "Manage where withdrawals are sent",
    href: "#payout",
  },
  {
    key: "notifications",
    icon: Bell,
    label: "Notification Preferences",
    sub: "Choose what you're notified about",
  },
];

export function SettingsSubNav() {
  return (
    <div className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card lg:sticky lg:top-24">
      <h2 className="mb-3 px-2 text-sm font-bold text-slate-900">Settings</h2>
      <ul className="flex flex-col gap-1">
        {CATEGORIES.map((c) => {
          const content = (
            <>
              <span
                className={
                  c.href
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"
                }
              >
                <c.icon size={17} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span
                  className={
                    c.href
                      ? "block text-sm font-semibold text-slate-900"
                      : "block text-sm font-semibold text-slate-500"
                  }
                >
                  {c.label}
                </span>
                <span className="block text-xs text-slate-400">{c.sub}</span>
              </span>
              {!c.href && (
                <span className="ml-auto shrink-0 self-start rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                  Soon
                </span>
              )}
            </>
          );

          return (
            <li key={c.key}>
              {c.href ? (
                <Link
                  href={c.href}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-violet-50"
                >
                  {content}
                </Link>
              ) : (
                <div
                  className="flex cursor-not-allowed items-start gap-3 rounded-xl p-3 opacity-60"
                  title="Coming in a later phase"
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
