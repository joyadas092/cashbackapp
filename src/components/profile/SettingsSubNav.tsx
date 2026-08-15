import { Card } from "@/components/ui/Card";

const CATEGORIES = [
  { key: "profile", icon: "👤", label: "Profile Settings", sub: "Update your personal information", active: true },
  { key: "security", icon: "🛡️", label: "Account & Security", sub: "Change password and secure your account" },
  { key: "bank", icon: "🏦", label: "Bank Details", sub: "Manage your payout accounts" },
  { key: "notifications", icon: "🔔", label: "Notification Preferences", sub: "Choose what you're notified about" },
];

export function SettingsSubNav() {
  return (
    <Card variant="light" className="p-4">
      <h2 className="mb-3 px-2 text-sm font-bold text-slate-900">Settings Categories</h2>
      <ul className="flex flex-col gap-1">
        {CATEGORIES.map((c) => (
          <li key={c.key}>
            <div
              className={
                c.active
                  ? "flex items-start gap-3 rounded-xl bg-violet-50 p-3"
                  : "flex cursor-not-allowed items-start gap-3 rounded-xl p-3 opacity-50"
              }
              title={c.active ? undefined : "Coming in a later phase"}
            >
              <span className="text-base leading-none">{c.icon}</span>
              <div className="min-w-0">
                <div
                  className={
                    c.active
                      ? "text-sm font-semibold text-violet-700"
                      : "text-sm font-semibold text-slate-500"
                  }
                >
                  {c.label}
                </div>
                <div className="text-xs text-slate-400">{c.sub}</div>
              </div>
              {!c.active && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                  Soon
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
