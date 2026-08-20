import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { Avatar } from "@/components/shared/Avatar";
import { LocalTime } from "@/components/shared/LocalTime";

const PAGE_SIZE = 40;

/** Keys whose values must never be rendered, whatever a caller wrote into the log. */
const SECRET_KEY = /secret|token|password|key|hash/i;

const ACTION_TONES: Record<string, string> = {
  withdrawal_process: "bg-cashlime-50 text-cashlime-700",
  password_change: "bg-amber-50 text-amber-700",
  support_ticket_update: "bg-sky-50 text-sky-700",
  store_page_content_update: "bg-violet-50 text-violet-700",
  referral_rule_update: "bg-violet-50 text-violet-700",
};

function dateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Render a log's metadata as key/value pairs, redacting anything that looks
 * like a credential. Audit metadata is written by many call sites, so this
 * assumes a secret could end up there rather than trusting that none ever will.
 */
function summarise(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—";

  const entries = Object.entries(metadata as Record<string, unknown>)
    .map(([key, value]) => {
      if (SECRET_KEY.test(key)) return `${key}: [redacted]`;
      if (value === null || value === undefined) return null;
      if (typeof value === "object") return `${key}: …`;
      return `${key}: ${String(value)}`;
    })
    .filter((entry): entry is string => entry !== null);

  return entries.length > 0 ? entries.join(" · ") : "—";
}

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdminSession("/admin/activity-logs");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminPageHeader
        title="Activity Logs"
        subtitle="Who changed what, and when. Append-only — entries are never edited or deleted."
      />

      <AdminCard padded={false}>
        {logs.length === 0 ? (
          <AdminEmpty
            title="No activity recorded yet"
            body="Admin actions and account changes are written here as they happen."
          />
        ) : (
          <AdminTableWrap minWidth={900}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>When</AdminTh>
                <AdminTh>Actor</AdminTh>
                <AdminTh>Action</AdminTh>
                <AdminTh>Entity</AdminTh>
                <AdminTh>Details</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    <LocalTime value={log.createdAt.toISOString()} />
                  </td>
                  <td className="px-5 py-3">
                    {log.actor ? (
                      <span className="flex items-center gap-2.5">
                        <Avatar name={log.actor.name} seed={log.actor.id} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate text-slate-800">{log.actor.name}</span>
                          <span className="block truncate text-xs text-slate-400">
                            {log.actor.email}
                          </span>
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">System</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <AdminBadge
                      label={log.action.replace(/_/g, " ")}
                      tone={ACTION_TONES[log.action] ?? "bg-slate-100 text-slate-600"}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <span className="block text-slate-700">{log.entityType ?? "—"}</span>
                    {log.entityId && (
                      <span className="block truncate font-mono text-xs text-slate-400">
                        {log.entityId}
                      </span>
                    )}
                  </td>
                  <td className="max-w-md px-5 py-3">
                    <span className="block truncate text-xs text-slate-500">
                      {summarise(log.metadata)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="entries"
          hrefForPage={(p) => `/admin/activity-logs?page=${p}`}
        />
      </AdminCard>
    </div>
  );
}
