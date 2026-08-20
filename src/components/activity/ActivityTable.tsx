import Link from "next/link";
import { Inbox } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { LocalTime } from "@/components/shared/LocalTime";

export interface ActivityCell {
  /** Plain text, or a store chip when `store` is set. */
  text?: string;
  store?: { name: string; slug: string; logoUrl: string };
  /**
   * ISO timestamp, rendered in the viewer's timezone. Kept separate from
   * `text` because a date formatted on the server carries the server's
   * timezone, which is UTC in production.
   */
  iso?: string;
  isoFormat?: "datetime" | "date";
  /** Full URL shown as selectable text with a copy affordance. */
  link?: { href: string; label?: string };
  tone?: "default" | "muted" | "money" | "debit" | "mono";
  badge?: { label: string; tone: string };
  nowrap?: boolean;
}

export interface ActivityColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export interface ActivityRow {
  id: string;
  cells: Record<string, ActivityCell>;
}

const TONES: Record<NonNullable<ActivityCell["tone"]>, string> = {
  default: "text-slate-800",
  muted: "text-slate-500",
  money: "font-semibold text-cashlime-700",
  debit: "font-semibold text-rose-600",
  mono: "font-mono text-xs text-slate-600",
};

export const STATUS_TONES: Record<string, string> = {
  CONFIRMED: "bg-cashlime-50 text-cashlime-700",
  COMPLETED: "bg-cashlime-50 text-cashlime-700",
  PENDING: "bg-amber-50 text-amber-700",
  TRACKED: "bg-sky-50 text-sky-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
  REVERSED: "bg-slate-100 text-slate-500",
  FAILED: "bg-rose-50 text-rose-600",
  PAID: "bg-violet-50 text-violet-700",
};

/**
 * Shared table for the activity views. They differ in columns but not in shape,
 * so this keeps seven tabs from becoming seven near-identical tables.
 */
export function ActivityTable({
  columns,
  rows,
  empty,
  page,
  totalPages,
  total,
  hrefForPage,
}: {
  columns: ActivityColumn[];
  rows: ActivityRow[];
  empty: { title: string; body: string };
  page: number;
  totalPages: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Inbox size={22} strokeWidth={1.75} />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-700">{empty.title}</p>
        <p className="mt-1 text-sm text-slate-500">{empty.body}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                {columns.map((col) => {
                  const cell = row.cells[col.key];
                  return (
                    <td
                      key={col.key}
                      className={`px-5 py-3 ${col.align === "right" ? "text-right" : ""} ${
                        cell?.nowrap ? "whitespace-nowrap" : ""
                      }`}
                    >
                      {cell?.iso ? (
                        <LocalTime
                          value={cell.iso}
                          format={cell.isoFormat ?? "datetime"}
                          className={TONES[cell.tone ?? "muted"]}
                        />
                      ) : cell?.link ? (
                        <a
                          href={cell.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-mono text-xs text-violet-700 hover:underline"
                        >
                          {cell.link.label ?? cell.link.href}
                        </a>
                      ) : cell?.store ? (
                        <Link
                          href={`/stores/${cell.store.slug}`}
                          className="flex items-center gap-2.5 font-medium text-slate-800 hover:text-violet-700"
                        >
                          <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                            <StoreLogo
                              src={cell.store.logoUrl}
                              alt={cell.store.name}
                              size={26}
                              fallbackSlug={cell.store.slug}
                            />
                          </span>
                          <span className="truncate">{cell.store.name}</span>
                        </Link>
                      ) : cell?.badge ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cell.badge.tone}`}
                        >
                          {cell.badge.label}
                        </span>
                      ) : (
                        <span className={TONES[cell?.tone ?? "default"]}>{cell?.text ?? "—"}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages} · {total} entries
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
      )}
    </>
  );
}
