"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock } from "lucide-react";

const field =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white";
const label = "text-sm font-medium text-slate-700";

export function AccountForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string; referralCode: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty = name !== initial.name || phone !== initial.phone;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not save your details." });
      return;
    }
    setMessage({ kind: "ok", text: "Saved." });
    router.refresh();
  }

  return (
    <section
      id="profile"
      className="scroll-mt-24 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <h2 className="text-lg font-bold text-slate-900">Profile Settings</h2>
      <p className="mt-0.5 text-sm text-slate-500">Your personal information</p>

      <form onSubmit={handleSave} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="acc-name" className={label}>
            Full Name
          </label>
          <input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="acc-phone" className={label}>
            Mobile Number
          </label>
          <input
            id="acc-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="10-digit mobile number"
            className={field}
          />
        </div>

        <div>
          <span className={label}>Email Address</span>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-2.5 text-sm text-slate-600">
            <Lock size={13} strokeWidth={2} className="shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate">{initial.email}</span>
            <BadgeCheck size={15} strokeWidth={2} className="shrink-0 text-cashlime-600" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Your email is your login, so changing it needs verification. Contact support to update
            it.
          </p>
        </div>

        <div>
          <span className={label}>Referral Code</span>
          <div className="mt-1.5 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5 text-sm font-bold tracking-wide text-violet-700">
            {initial.referralCode}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Permanent — links you to everyone you&apos;ve referred.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving || !dirty}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
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
