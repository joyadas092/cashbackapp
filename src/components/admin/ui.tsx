import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

/** Page heading with an optional subtitle and right-hand actions. */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminCard({
  title,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`rounded-xl2 border border-slate-200 bg-white shadow-card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 px-5 pt-5">
          {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

/**
 * KPI tile. `delta` is a percentage change against the previous period, or null
 * when there is no prior figure — rendering "+100%" against a zero baseline is
 * noise, so the chip is dropped instead.
 */
export function AdminStat({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  deltaNote,
  invertDelta = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  delta?: number | null;
  deltaNote?: string;
  /** For metrics where growth is bad — pending payouts rising isn't a win. */
  invertDelta?: boolean;
}) {
  const good = delta === null || delta === undefined ? null : invertDelta ? delta <= 0 : delta >= 0;

  return (
    <div className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-0.5 truncate text-xl font-extrabold text-slate-900">{value}</div>
        </div>
      </div>

      {delta !== null && delta !== undefined && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className={`flex items-center gap-0.5 font-semibold ${
              good ? "text-cashlime-700" : "text-rose-600"
            }`}
          >
            {delta >= 0 ? (
              <ArrowUpRight size={12} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={12} strokeWidth={2.5} />
            )}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
          {deltaNote && <span className="text-slate-400">{deltaNote}</span>}
        </div>
      )}
    </div>
  );
}

export function AdminBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
  );
}

export function AdminEmpty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
    </div>
  );
}

/** Wide tables must scroll inside their card, never widen the page. */
export function AdminTableWrap({
  children,
  minWidth = 760,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function AdminTh({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

export function AdminPagination({
  page,
  totalPages,
  total,
  hrefForPage,
  noun = "rows",
}: {
  page: number;
  totalPages: number;
  total: number;
  hrefForPage: (page: number) => string;
  noun?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
      <span className="text-xs text-slate-400">
        Page {page} of {totalPages} · {total} {noun}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-300">
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefForPage(page + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-300">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
