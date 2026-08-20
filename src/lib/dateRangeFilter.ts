/**
 * Date-range filtering shared by every admin and dashboard list.
 *
 * Follows the same shape as src/lib/adminUserFilters.ts — parse from the query
 * string, build a Prisma filter, rebuild the query string — so a filtered view
 * is always a shareable URL and an Export can reuse exactly the query the admin
 * is looking at.
 *
 * Unknown or malformed values fall back to "all" rather than erroring: these
 * arrive from UI controls and a bad value should never break the page.
 */

export type DateRangePreset = "all" | "today" | "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  /** yyyy-mm-dd, only meaningful when preset is "custom". */
  from: string;
  to: string;
}

export const DATE_PRESETS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export function parseDateRange(params: URLSearchParams): DateRange {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  // An explicit from/to wins over the preset — if someone typed dates, that is
  // what they meant, whatever chip was selected.
  if (isValidDate(from) || isValidDate(to)) {
    return {
      preset: "custom",
      from: isValidDate(from) ? from : "",
      to: isValidDate(to) ? to : "",
    };
  }

  const preset = params.get("range") ?? "all";
  const known = DATE_PRESETS.some((option) => option.value === preset);
  return { preset: known ? (preset as DateRangePreset) : "all", from: "", to: "" };
}

/**
 * Same as parseDateRange, from a Next page's `searchParams` object.
 *
 * Next hands repeated query keys through as arrays; a date filter is always
 * single-valued, so the first value wins rather than the page erroring.
 */
export function parseDateRangeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): DateRange {
  const params = new URLSearchParams();
  for (const key of ["range", "from", "to"] as const) {
    const value = searchParams[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  return parseDateRange(params);
}

/**
 * Prisma filter for the range, or null when it covers everything.
 *
 * `to` is exclusive of the following day rather than inclusive of a timestamp:
 * filtering "to 5 March" must include everything that happened *during* 5
 * March, not stop at midnight as it begins.
 */
export function dateRangeWhere(range: DateRange): { gte?: Date; lt?: Date } | null {
  if (range.preset === "custom") {
    const filter: { gte?: Date; lt?: Date } = {};
    if (range.from) filter.gte = new Date(`${range.from}T00:00:00`);
    if (range.to) {
      const end = new Date(`${range.to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      filter.lt = end;
    }
    return Object.keys(filter).length > 0 ? filter : null;
  }

  if (range.preset === "all") return null;

  if (range.preset === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }

  const days = range.preset === "7d" ? 7 : range.preset === "30d" ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { gte: start };
}

/** True when the range actually narrows anything — used to show a "Clear" link. */
export function isDateRangeActive(range: DateRange): boolean {
  return dateRangeWhere(range) !== null;
}

/** Serialise back to query params, dropping defaults so URLs stay readable. */
export function dateRangeToParams(range: DateRange, params = new URLSearchParams()) {
  if (range.preset === "custom") {
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
  } else if (range.preset !== "all") {
    params.set("range", range.preset);
  }
  return params;
}
