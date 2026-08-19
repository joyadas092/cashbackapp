"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const select =
  "rounded-lg border border-white/15 bg-navy-900/80 px-3 py-2 text-sm text-white outline-none focus:border-violet-500";

export function TicketStatusControls({
  ticketId,
  status,
  priority,
}: {
  ticketId: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Record<string, string>) {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? "Could not update the ticket.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-white/60">
        Status
        <select
          value={status}
          disabled={saving}
          onChange={(e) => patch({ status: e.target.value })}
          className={select}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-white/60">
        Priority
        <select
          value={priority}
          disabled={saving}
          onChange={(e) => patch({ priority: e.target.value })}
          className={select}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      {error && <span className="text-sm text-red-300">{error}</span>}
    </div>
  );
}
