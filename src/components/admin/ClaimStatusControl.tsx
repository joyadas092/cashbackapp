"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ClaimStatus } from "@prisma/client";
import { CLAIM_STATUS_META, isClaimClosed } from "@/lib/claims";

const OPTIONS: ClaimStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ESCALATED",
  "APPROVED",
  "REJECTED",
];

/**
 * Moves a claim through its workflow.
 *
 * Approving or rejecting is final — the API refuses to reopen a decided claim —
 * so those two ask for confirmation rather than firing on a stray select.
 */
export function ClaimStatusControl({
  claimId,
  status,
}: {
  claimId: string;
  status: ClaimStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isClaimClosed(status)) {
    const meta = CLAIM_STATUS_META[status];
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
        {meta.label}
      </span>
    );
  }

  async function change(next: ClaimStatus) {
    if (next === status) return;
    if (
      isClaimClosed(next) &&
      !window.confirm(
        `Mark this claim ${CLAIM_STATUS_META[next].label.toLowerCase()}? This can't be undone.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not update the claim");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the claim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <select
        value={status}
        disabled={saving}
        onChange={(e) => void change(e.target.value as ClaimStatus)}
        aria-label="Claim status"
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 disabled:opacity-50"
      >
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {CLAIM_STATUS_META[option].label}
          </option>
        ))}
      </select>
      {saving && <Loader2 size={13} className="animate-spin text-slate-400" />}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
