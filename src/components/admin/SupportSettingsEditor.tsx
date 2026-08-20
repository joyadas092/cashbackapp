"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export interface SupportSettingsInitial {
  email: string;
  phone: string;
  whatsapp: string;
  hours: string;
  liveChatEnabled: boolean;
  liveChatNote: string;
  responseNote: string;
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500";
const label = "block text-xs font-medium uppercase tracking-wide text-slate-500";
const hint = "mt-1 text-xs text-slate-400";

export function SupportSettingsEditor({ initial }: { initial: SupportSettingsInitial }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof SupportSettingsInitial>(key: K, value: SupportSettingsInitial[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/admin/support/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not save." });
      return;
    }
    setMessage({ kind: "ok", text: "Saved. The Help page shows these channels now." });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Support Contact Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Channels shown on the user Help page. Leave one blank to hide it — an empty channel
            would otherwise render as an option that goes nowhere.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/help"
            target="_blank"
            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline"
          >
            View Help page
            <ExternalLink size={14} strokeWidth={2} />
          </Link>
          <button
            onClick={save}
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

      <section className="rounded-xl2 border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Channels</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Support email</label>
            <input
              className={`${field} mt-1.5`}
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="support@yourdomain.com"
            />
          </div>
          <div>
            <label className={label}>Phone number</label>
            <input
              className={`${field} mt-1.5`}
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 80 4567 8900"
            />
          </div>
          <div>
            <label className={label}>WhatsApp number</label>
            <input
              className={`${field} mt-1.5`}
              value={values.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+91 80 4567 8900"
            />
            <p className={hint}>Links to wa.me using the digits from this number.</p>
          </div>
          <div>
            <label className={label}>Support hours</label>
            <input
              className={`${field} mt-1.5`}
              value={values.hours}
              onChange={(e) => set("hours", e.target.value)}
              placeholder="Mon - Sun: 9:00 AM - 9:00 PM"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl2 border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Live chat &amp; response time</h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values.liveChatEnabled}
              onChange={(e) => set("liveChatEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white"
            />
            Show a Live Chat option
          </label>
          <p className={hint}>
            There is no chat widget yet — enabling this points users at the ticket form, which a
            person actually answers. Leave it off if that would be misleading.
          </p>

          <div>
            <label className={label}>Live chat note</label>
            <input
              className={`${field} mt-1.5`}
              value={values.liveChatNote}
              onChange={(e) => set("liveChatNote", e.target.value)}
              placeholder="Chat with our support team"
            />
          </div>

          <div>
            <label className={label}>Email response note</label>
            <input
              className={`${field} mt-1.5`}
              value={values.responseNote}
              onChange={(e) => set("responseNote", e.target.value)}
              placeholder="We usually reply within 24 hours"
            />
            <p className={hint}>Only promise a turnaround you can actually hit.</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
