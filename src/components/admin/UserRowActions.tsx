"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, BadgeCheck, Eye, MoreVertical, ShieldAlert, ShieldCheck, X } from "lucide-react";

const RISK_ACTIONS = [
  { value: "NORMAL", label: "Mark active", icon: ShieldCheck },
  { value: "REVIEW", label: "Put under review", icon: ShieldAlert },
  { value: "RESTRICTED", label: "Restrict withdrawals", icon: ShieldAlert },
  { value: "BLOCKED", label: "Block account", icon: Ban },
] as const;

const KYC_ACTIONS = [
  { value: "VERIFIED", label: "Mark KYC verified" },
  { value: "PENDING", label: "Mark KYC pending" },
  { value: "REJECTED", label: "Reject KYC" },
] as const;

/**
 * Per-user action menu.
 *
 * Blocking and restricting really do cut off access — blocked accounts can't
 * sign in and restricted ones can't withdraw — so both ask for confirmation
 * rather than acting on one click in a dense table.
 */
export function UserRowActions({
  userId,
  userName,
  riskStatus,
  isAdmin,
  isSelf,
}: {
  userId: string;
  userName: string;
  riskStatus: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, string>) {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(payload.error ?? "Could not update that user.");
      return;
    }
    setOpen(false);
    setConfirming(null);
    router.refresh();
  }

  // Protecting admins and yourself is enforced server-side too; hiding the
  // options here just avoids offering an action that will always fail.
  const riskLocked = isAdmin || isSelf;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${userName}`}
        aria-expanded={open}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-20 mt-1 w-60 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              href={`/admin/users/${userId}`}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye size={14} strokeWidth={2} className="text-slate-400" />
              View full record
            </Link>

            <div className="my-1 border-t border-slate-100" />

            {riskLocked ? (
              <p className="px-4 py-2 text-xs text-slate-400">
                {isSelf
                  ? "You can't change your own account status."
                  : "Admin accounts can't be restricted."}
              </p>
            ) : (
              RISK_ACTIONS.filter((action) => action.value !== riskStatus).map((action) => (
                <button
                  key={action.value}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    action.value === "NORMAL"
                      ? patch({ riskStatus: action.value })
                      : setConfirming(action.value)
                  }
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <action.icon
                    size={14}
                    strokeWidth={2}
                    className={action.value === "BLOCKED" ? "text-rose-500" : "text-slate-400"}
                  />
                  {action.label}
                </button>
              ))
            )}

            <div className="my-1 border-t border-slate-100" />

            {KYC_ACTIONS.map((action) => (
              <button
                key={action.value}
                type="button"
                disabled={busy}
                onClick={() => patch({ kycStatus: action.value })}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <BadgeCheck size={14} strokeWidth={2} className="text-slate-400" />
                {action.label}
              </button>
            ))}

            {error && <p className="px-4 py-2 text-xs text-rose-600">{error}</p>}
          </div>
        </>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirming(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl2 border border-slate-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                {confirming === "BLOCKED" ? "Block" : "Restrict"} {userName}?
              </h3>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {confirming === "BLOCKED"
                ? "They won't be able to sign in at all. Their balance and history are kept, and you can undo this later."
                : confirming === "RESTRICTED"
                  ? "They can still sign in and earn, but withdrawals will be refused until you lift it."
                  : "They stay fully active — this only flags the account for a closer look."}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => patch({ riskStatus: confirming })}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${
                  confirming === "BLOCKED"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {busy ? "Applying..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
