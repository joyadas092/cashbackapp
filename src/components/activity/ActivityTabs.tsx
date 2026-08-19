import Link from "next/link";

export const ACTIVITY_TABS = [
  { key: "overview", label: "Overview" },
  { key: "own-clicks", label: "Own Click History" },
  { key: "own-transactions", label: "Transaction History" },
  { key: "affiliate-clicks", label: "Affiliate Click History" },
  { key: "affiliate-transactions", label: "Affiliate Transaction History" },
  { key: "referred-transactions", label: "Referred User Transactions" },
  { key: "referral-earnings", label: "Referral Transaction History" },
] as const;

export type ActivityTabKey = (typeof ACTIVITY_TABS)[number]["key"];

export function isActivityTab(value: string | undefined): value is ActivityTabKey {
  return ACTIVITY_TABS.some((tab) => tab.key === value);
}

/**
 * Tabs are links, not client state. Each one is a different query against a
 * different table, and they're paginated — routing keeps a tab plus its page
 * number in the URL, so a row is linkable and the back button behaves.
 */
export function ActivityTabs({ active }: { active: ActivityTabKey }) {
  return (
    <nav
      aria-label="Activity views"
      className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5"
    >
      {ACTIVITY_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.key === "overview" ? "/dashboard/activity" : `/dashboard/activity?tab=${tab.key}`}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
              isActive
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
