import Link from "next/link";
import { CalendarDays } from "lucide-react";
import {
  DATE_PRESETS,
  isDateRangeActive,
  type DateRange,
} from "@/lib/dateRangeFilter";

/**
 * Date-range control for list pages.
 *
 * Rendered inside the page's existing GET form, so a chosen range is part of the
 * URL and an Export link can reuse the same query. Presets are links rather than
 * form state for the same reason — each one is a shareable address.
 *
 * `hiddenFields` carries the page's other filters through the preset links, so
 * picking "Last 7 days" doesn't silently drop a search term.
 */
export function DateRangeFilter({
  range,
  basePath,
  hiddenFields = {},
}: {
  range: DateRange;
  basePath: string;
  hiddenFields?: Record<string, string>;
}) {
  const presetHref = (preset: string) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(hiddenFields)) {
      if (value) params.set(key, value);
    }
    if (preset !== "all") params.set("range", preset);
    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <CalendarDays size={14} strokeWidth={2} className="text-slate-400" />
        Date
      </span>

      {DATE_PRESETS.map((preset) => {
        const active = range.preset === preset.value;
        return (
          <Link
            key={preset.value}
            href={presetHref(preset.value)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "border-violet-600 bg-violet-50 text-violet-700"
                : "border-slate-200 text-slate-600 hover:border-violet-300"
            }`}
          >
            {preset.label}
          </Link>
        );
      })}

      <span className="flex items-center gap-1.5">
        <input
          type="date"
          name="from"
          defaultValue={range.from}
          aria-label="From date"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-violet-400"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          name="to"
          defaultValue={range.to}
          aria-label="To date"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-violet-400"
        />
      </span>

      {isDateRangeActive(range) && (
        <Link
          href={presetHref("all")}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
        >
          Clear dates
        </Link>
      )}
    </div>
  );
}
