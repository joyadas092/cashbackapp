"use client";

import { useState } from "react";
import { Landmark, ShieldCheck } from "lucide-react";

export interface ProfileFormInitial {
  upiId: string | null;
  bankDetails: {
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
    pan?: string;
  } | null;
  kycStatus: string | null;
}

const field =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white";
const label = "text-sm font-medium text-slate-700";

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const [upiId, setUpiId] = useState(initial.upiId ?? "");
  const [accountHolder, setAccountHolder] = useState(initial.bankDetails?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(initial.bankDetails?.accountNumber ?? "");
  const [ifsc, setIfsc] = useState(initial.bankDetails?.ifsc ?? "");
  const [pan, setPan] = useState(initial.bankDetails?.pan ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upiId: upiId.trim() || null,
        bankDetails:
          accountHolder || accountNumber || ifsc || pan
            ? {
                accountHolder: accountHolder.trim(),
                accountNumber: accountNumber.trim(),
                ifsc: ifsc.trim().toUpperCase(),
                pan: pan.trim().toUpperCase(),
              }
            : null,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage({ kind: "err", text: body.error ?? "Could not save your payout details." });
      return;
    }
    setMessage({ kind: "ok", text: "Saved." });
  }

  const kyc = initial.kycStatus ?? "Not submitted";

  return (
    <section
      id="payout"
      className="scroll-mt-24 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cashlime-50 text-cashlime-700">
            <Landmark size={19} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bank &amp; Payout Details</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Where your withdrawals are sent. Add at least one method before withdrawing.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          KYC: {kyc}
        </span>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-5">
        <div>
          <label htmlFor="pay-upi" className={label}>
            UPI ID
          </label>
          <input
            id="pay-upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="you@upi"
            className={field}
          />
          <p className="mt-1 text-xs text-slate-400">Fastest option — usually instant.</p>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="text-sm font-semibold text-slate-900">Bank account</div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pay-holder" className={label}>
                Account holder
              </label>
              <input
                id="pay-holder"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="As printed on the account"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="pay-account" className={label}>
                Account number
              </label>
              <input
                id="pay-account"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                inputMode="numeric"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="pay-ifsc" className={label}>
                IFSC
              </label>
              <input
                id="pay-ifsc"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                placeholder="ABCD0123456"
                className={`${field} uppercase`}
              />
            </div>
            <div>
              <label htmlFor="pay-pan" className={label}>
                PAN
              </label>
              <input
                id="pay-pan"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                placeholder="ABCDE1234F"
                maxLength={10}
                aria-describedby="pay-pan-help"
                className={`${field} uppercase`}
              />
              <p id="pay-pan-help" className="mt-1 text-xs text-slate-400">
                Needed for TDS on larger withdrawals. Optional below that limit.
              </p>
            </div>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
          <ShieldCheck size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-cashlime-600" />
          These details are only used to pay you. We never share them with stores, and we never ask
          for them by email or phone.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Payout Details"}
          </button>
          {message && (
            <span
              className={`text-sm font-medium ${
                message.kind === "ok" ? "text-cashlime-700" : "text-red-600"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
