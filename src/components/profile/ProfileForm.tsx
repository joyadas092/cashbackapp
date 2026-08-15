"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface ProfileFormInitial {
  upiId: string | null;
  bankDetails: { accountHolder?: string; accountNumber?: string; ifsc?: string } | null;
  kycStatus: string | null;
}

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const [upiId, setUpiId] = useState(initial.upiId ?? "");
  const [accountHolder, setAccountHolder] = useState(initial.bankDetails?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(initial.bankDetails?.accountNumber ?? "");
  const [ifsc, setIfsc] = useState(initial.bankDetails?.ifsc ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upiId: upiId || null,
        bankDetails:
          accountHolder || accountNumber || ifsc
            ? { accountHolder, accountNumber, ifsc }
            : null,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save");
      return;
    }
    setSaved(true);
  }

  return (
    <Card variant="light" className="p-6">
      <h2 className="text-lg font-bold text-slate-900">Payout Details</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        KYC status: {initial.kycStatus ?? "Not submitted"}
      </p>

      <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          UPI ID
          <Input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="you@upi"
            variant="light"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Account holder
            <Input
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              variant="light"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Account number
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              variant="light"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            IFSC
            <Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} variant="light" />
          </label>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          {saved && <span className="text-sm font-medium text-cashlime-700">Saved.</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </Card>
  );
}
