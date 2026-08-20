"use client";

import { useEffect, useState } from "react";

export type LocalTimeFormat = "datetime" | "date" | "time" | "short";

const OPTIONS: Record<LocalTimeFormat, Intl.DateTimeFormatOptions> = {
  datetime: {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  date: { day: "2-digit", month: "short", year: "numeric" },
  time: { hour: "2-digit", minute: "2-digit" },
  short: { day: "2-digit", month: "short" },
};

function render(iso: string, format: LocalTimeFormat, timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { ...OPTIONS[format], timeZone }).format(date);
}

/**
 * Renders a timestamp in the viewer's own timezone.
 *
 * Server components format dates with the *server's* timezone, which on Railway
 * is UTC — so every time in the app read several hours behind for users in
 * India. This fixes that without a hydration mismatch: the first paint uses a
 * fixed timezone (so server and client markup agree), then the effect re-renders
 * once in whatever timezone the browser is actually in.
 *
 * The underlying instant is always in the `dateTime` attribute, so the exact
 * value is available to assistive tech and to anyone inspecting the page,
 * regardless of how it is displayed.
 */
export function LocalTime({
  value,
  format = "datetime",
  className,
}: {
  /** ISO 8601 string. Dates must be serialised before crossing to the client. */
  value: string | null | undefined;
  format?: LocalTimeFormat;
  className?: string;
}) {
  // Matches the server's assumed timezone for the first paint. Anyone outside
  // IST sees the correct value a tick later, once the effect runs.
  const [timeZone, setTimeZone] = useState<string | undefined>("Asia/Kolkata");

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  if (!value) return <span className={className}>—</span>;

  return (
    <time dateTime={value} className={className} suppressHydrationWarning>
      {render(value, format, timeZone)}
    </time>
  );
}
