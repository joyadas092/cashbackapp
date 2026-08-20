"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export interface ReferralSettingsEditorProps {
  initial: {
    headlineRatePct: string;
    publicHeadline: string;
    publicSubtext: string;
    fixedBonus: string;
    durationDays: string;
    maxTotalEarning: string;
    minOrderValue: string;
  };
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500";
const label = "block text-xs font-medium uppercase tracking-wide text-slate-500";
const hint = "mt-1 text-xs text-slate-400";

/** "" means "not set" (null), not zero — an empty cap is unlimited, not a cap of 0. */
function toPayload(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

export function ReferralSettingsEditor({ initial }: ReferralSettingsEditorProps) {
  const [headlineRatePct, setHeadlineRatePct] = useState(initial.headlineRatePct);
  const [publicHeadline, setPublicHeadline] = useState(initial.publicHeadline);
  const [publicSubtext, setPublicSubtext] = useState(initial.publicSubtext);
  const [fixedBonus, setFixedBonus] = useState(initial.fixedBonus);
  const [durationDays, setDurationDays] = useState(initial.durationDays);
  const [maxTotalEarning, setMaxTotalEarning] = useState(initial.maxTotalEarning);
  const [minOrderValue, setMinOrderValue] = useState(initial.minOrderValue);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/admin/referral", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headlineRatePct: toPayload(headlineRatePct),
        publicHeadline: publicHeadline.trim(),
        publicSubtext: publicSubtext.trim(),
        fixedBonus: toPayload(fixedBonus),
        durationDays: toPayload(durationDays),
        maxTotalEarning: toPayload(maxTotalEarning),
        minOrderValue: toPayload(minOrderValue),
      }),
    });

    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not save." });
      return;
    }
    setMessage({ kind: "ok", text: "Saved. Both referral pages are live with these values." });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Refer &amp; Earn Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            One active rule drives both the public landing page and what the payout engine
            actually credits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/refer-earn"
            target="_blank"
            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline"
          >
            View public page
            <ExternalLink size={14} strokeWidth={2} />
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-cashlime-200 bg-cashlime-50 text-cashlime-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* --- Advertised rate --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Public landing page</h2>
        <p className="mt-1 text-sm text-slate-500">
          What visitors see at <code className="text-violet-700">/refer-earn</code> before signing
          up.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Headline rate %</label>
            <input
              className={`${field} mt-1.5`}
              value={headlineRatePct}
              onChange={(e) => setHeadlineRatePct(e.target.value)}
              placeholder="5"
              inputMode="decimal"
            />
            <p className={hint}>
              The big &ldquo;GET X% OF INCOME&rdquo; figure. This is a public promise — it is the
              share of <em>our</em> commission, not a per-store rate. Leave blank to hide every
              percentage on the page.
            </p>
          </div>

          <div>
            <label className={label}>Headline text</label>
            <input
              className={`${field} mt-1.5`}
              value={publicHeadline}
              onChange={(e) => setPublicHeadline(e.target.value)}
              placeholder="Refer Friends,"
            />
            <p className={hint}>
              First line of the hero. &ldquo;Earn More!&rdquo; always follows it.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Sub-heading</label>
            <textarea
              className={`${field} mt-1.5 min-h-[70px] rounded-lg`}
              value={publicSubtext}
              onChange={(e) => setPublicSubtext(e.target.value)}
              placeholder="Leave blank to use the default, which fills in the rate automatically."
            />
          </div>
        </div>
      </section>

      {/* --- Payout rules --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Payout rules</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enforced by the referral engine on every confirmed order. Blank means no limit.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Earning window (days)</label>
            <input
              className={`${field} mt-1.5`}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="90"
              inputMode="numeric"
            />
            <p className={hint}>How long after joining a friend&apos;s orders still earn.</p>
          </div>

          <div>
            <label className={label}>Cap per referred friend (₹)</label>
            <input
              className={`${field} mt-1.5`}
              value={maxTotalEarning}
              onChange={(e) => setMaxTotalEarning(e.target.value)}
              placeholder="500"
              inputMode="decimal"
            />
            <p className={hint}>Total a single referral can ever earn the referrer.</p>
          </div>

          <div>
            <label className={label}>Minimum order value (₹)</label>
            <input
              className={`${field} mt-1.5`}
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              placeholder="No minimum"
              inputMode="decimal"
            />
            <p className={hint}>Orders below this earn no referral commission.</p>
          </div>

          <div>
            <label className={label}>Signup bonus for the friend (₹)</label>
            <input
              className={`${field} mt-1.5`}
              value={fixedBonus}
              onChange={(e) => setFixedBonus(e.target.value)}
              placeholder="No bonus"
              inputMode="decimal"
            />
            <p className={hint}>Shown to users as what their friend gets. Blank hides it.</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
