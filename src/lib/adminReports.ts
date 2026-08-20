import type { DualSeriesPoint } from "@/components/admin/AdminCharts";

export const REPORT_WINDOW_DAYS = 15;

/** Percentage change, or null when there's no prior figure to compare against. */
export function reportDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function reportWindows(days = REPORT_WINDOW_DAYS) {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - days);
  const priorStart = new Date(now);
  priorStart.setDate(now.getDate() - days * 2);

  return {
    now,
    periodStart,
    priorStart,
    inPeriod: { gte: periodStart },
    inPrior: { gte: priorStart, lt: periodStart },
  };
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Bucket two independent event streams into one daily series.
 *
 * Prisma's groupBy can't truncate a DateTime to a day, so this does it in JS
 * over a bounded window. Every day in the window is seeded first, so a quiet
 * day renders as a zero rather than being skipped and distorting the line.
 */
export function buildDualSeries(
  primary: Array<{ createdAt: Date }>,
  secondary: Array<{ createdAt: Date; amount?: unknown }>,
  options: { days?: number; sumSecondary?: boolean } = {}
): DualSeriesPoint[] {
  const days = options.days ?? REPORT_WINDOW_DAYS;
  const now = new Date();
  const buckets = new Map<string, { primary: number; secondary: number }>();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    buckets.set(dayKey(date), { primary: 0, secondary: 0 });
  }

  for (const row of primary) {
    const bucket = buckets.get(dayKey(row.createdAt));
    if (bucket) bucket.primary += 1;
  }

  for (const row of secondary) {
    const bucket = buckets.get(dayKey(row.createdAt));
    if (!bucket) continue;
    bucket.secondary += options.sumSecondary ? Number(row.amount ?? 0) : 1;
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    label: new Date(key).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    primary: value.primary,
    secondary: Math.round(value.secondary * 100) / 100,
  }));
}

export function reportDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
