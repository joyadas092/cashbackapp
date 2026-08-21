"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Check, ExternalLink, Info } from "lucide-react";

export interface SettingsValues {
  siteName: string;
  siteTagline: string;
  adminEmail: string;
  supportEmail: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  affiliateEnabled: boolean;
  referralEnabled: boolean;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  profitLinkGuestCashback: "SHARER" | "PLATFORM";
  panRequiredAboveAmount: number;
  payoutMethods: string[];
  seoTitle: string;
  seoDescription: string;
  searchIndexingEnabled: boolean;
}

export interface SystemInfo {
  runtime: string;
  environment: string;
  database: string;
  serverTime: string;
  siteUrl: string;
  cuelinksConfigured: boolean;
  cuelinksChannel: string | null;
  postbackSecretSet: boolean;
  redisConfigured: boolean;
  postbackUrl: string;
}

const TABS = [
  { key: "general", label: "General" },
  { key: "platform", label: "Platform" },
  { key: "payouts", label: "Payouts" },
  { key: "seo", label: "SEO" },
  { key: "integrations", label: "Integrations" },
  { key: "system", label: "System" },
] as const;

const PAYOUT_METHODS = [
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "PAYTM", label: "Paytm" },
  { value: "AMAZON_PAY", label: "Amazon Pay" },
];

const field =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400";
const label = "text-sm font-medium text-slate-700";

function Toggle({
  checked,
  onChange,
  title,
  description,
  tone = "violet",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
  tone?: "violet" | "amber";
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block text-sm text-slate-500">{description}</span>
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`block h-6 w-11 rounded-full transition-colors ${
            checked ? (tone === "amber" ? "bg-amber-500" : "bg-violet-600") : "bg-slate-300"
          }`}
        />
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </label>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fact({ label: name, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{name}</span>
      <span className="min-w-0 truncate text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function SettingsWorkspace({
  initial,
  system,
}: {
  initial: SettingsValues;
  system: SystemInfo;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("general");
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof SettingsValues>(key: K, next: SettingsValues[K]) {
    setValues((current) => ({ ...current, [key]: next }));
  }

  /** Saves only the keys for the tab in view, so one tab can't clobber another. */
  async function save(keys: Array<keyof SettingsValues>) {
    setSaving(true);
    setMessage(null);

    const payload: Record<string, unknown> = {};
    for (const key of keys) payload[key] = values[key];

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not save those settings." });
      return;
    }
    setMessage({ kind: "ok", text: "Saved." });
    router.refresh();
  }

  function SaveBar({ keys }: { keys: Array<keyof SettingsValues> }) {
    return (
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save(keys)}
          disabled={saving}
          className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {message && (
          <span
            className={`flex items-center gap-1.5 text-sm font-medium ${
              message.kind === "ok" ? "text-cashlime-700" : "text-rose-600"
            }`}
          >
            {message.kind === "ok" && <Check size={14} strokeWidth={2.5} />}
            {message.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        <nav role="tablist" className="flex gap-1 overflow-x-auto px-4 sm:px-5">
          {TABS.map((item) => {
            const isActive = item.key === tab;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setTab(item.key);
                  setMessage(null);
                }}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "general" && (
        <Card title="General Settings" subtitle="Your platform's basic identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Site / App Name</label>
              <input className={field} value={values.siteName} onChange={(e) => set("siteName", e.target.value)} />
              <p className="mt-1 text-xs text-slate-400">Used in page titles across the site.</p>
            </div>
            <div>
              <label className={label}>Tagline</label>
              <input className={field} value={values.siteTagline} onChange={(e) => set("siteTagline", e.target.value)} />
            </div>
            <div>
              <label className={label}>Admin Email</label>
              <input className={field} type="email" value={values.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} placeholder="admin@yourdomain.com" />
            </div>
            <div>
              <label className={label}>Support Email</label>
              <input className={field} type="email" value={values.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="support@yourdomain.com" />
              <p className="mt-1 text-xs text-slate-400">
                Shown on the Help page. Also editable under Support Contact Settings.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />
              <span>
                Currency and locale are fixed at <strong>INR</strong> and <strong>en-IN</strong>.
                Every amount in the app is formatted through one helper, and offering a picker that
                didn&apos;t change that formatting would be misleading. Changing them is a code
                change, not a setting.
              </span>
            </p>
          </div>

          <SaveBar keys={["siteName", "siteTagline", "adminEmail", "supportEmail"]} />
        </Card>
      )}

      {tab === "platform" && (
        <div className="space-y-6">
          <Card title="Application Preferences" subtitle="Each of these is enforced on the server, not just hidden in the UI">
            <Toggle
              checked={values.registrationEnabled}
              onChange={(next) => set("registrationEnabled", next)}
              title="User Registration"
              description="Allow new people to create accounts. Off refuses sign-ups at the API too."
            />
            <Toggle
              checked={values.affiliateEnabled}
              onChange={(next) => set("affiliateEnabled", next)}
              title="Share & Earn"
              description="Allow users to generate profit links. Existing links keep working."
            />
            <Toggle
              checked={values.referralEnabled}
              onChange={(next) => set("referralEnabled", next)}
              title="Refer & Earn"
              description="Capture referrals when someone signs up through a referral link."
            />
            <Toggle
              checked={values.maintenanceMode}
              onChange={(next) => set("maintenanceMode", next)}
              title="Maintenance Mode"
              description="Show a holding page to everyone except admins. You keep full access."
              tone="amber"
            />

            {values.maintenanceMode && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertTriangle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
                  The public site will be unavailable once you save. Admins can still sign in and
                  turn this back off.
                </p>
                <label className={`${label} mt-3 block`}>Message shown to visitors</label>
                <input
                  className={field}
                  value={values.maintenanceMessage}
                  onChange={(e) => set("maintenanceMessage", e.target.value)}
                />
              </div>
            )}

            <SaveBar
              keys={[
                "registrationEnabled",
                "affiliateEnabled",
                "referralEnabled",
                "maintenanceMode",
                "maintenanceMessage",
              ]}
            />
          </Card>

          <Card
            title="Share &amp; Earn"
            subtitle="What happens to the shopper's cashback share when a guest buys through a shared link"
          >
            <p className="text-sm text-slate-600">
              When someone buys through a profit link without an account, there is no shopper to
              pay, so the customer share of the commission is unclaimed. Choose who receives it.
              When the buyer <em>is</em> signed in they get their cashback as normal and this
              setting does not apply.
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {(
                [
                  {
                    value: "SHARER" as const,
                    title: "The sharer",
                    body: "Added to their profit-link commission. The person whose link produced the sale is paid for it.",
                  },
                  {
                    value: "PLATFORM" as const,
                    title: "The platform",
                    body: "Kept as platform margin. Sharers receive only their profit-link share.",
                  },
                ]
              ).map((option) => {
                const active = values.profitLinkGuestCashback === option.value;
                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                      active
                        ? "border-violet-400 bg-violet-50/60"
                        : "border-slate-200 hover:border-violet-200"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="profitLinkGuestCashback"
                        checked={active}
                        onChange={() => set("profitLinkGuestCashback", option.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-semibold text-slate-900">{option.title}</span>
                    </span>
                    <span className="mt-1.5 block text-xs text-slate-500">{option.body}</span>
                  </label>
                );
              })}
            </div>

            <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
              Applies to sales recorded from now on. Transactions already stored keep the split
              they were created with, so past payouts and reversals stay consistent.
            </p>

            <SaveBar keys={["profitLinkGuestCashback"]} />
          </Card>

          <Card title="Not available yet" subtitle="Deliberately absent rather than shown as switches that do nothing">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <strong className="text-slate-800">Email verification & email notifications</strong>{" "}
                — no mail service is connected, so nothing can be sent.
              </li>
              <li>
                <strong className="text-slate-800">SMS notifications</strong> — no SMS gateway is
                connected.
              </li>
              <li>
                <strong className="text-slate-800">Automated backups</strong> — backups are taken at
                the database level, not from inside the app.
              </li>
            </ul>
          </Card>
        </div>
      )}

      {tab === "payouts" && (
        <Card title="Payout Rules" subtitle="Enforced by the withdrawal endpoint on every request">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Minimum withdrawal (₹)</label>
              <input
                className={field}
                inputMode="decimal"
                value={String(values.minWithdrawalAmount)}
                onChange={(e) => set("minWithdrawalAmount", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
              />
            </div>
            <div>
              <label className={label}>Maximum per request (₹)</label>
              <input
                className={field}
                inputMode="decimal"
                value={String(values.maxWithdrawalAmount)}
                onChange={(e) => set("maxWithdrawalAmount", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
              />
            </div>
            <div>
              <label className={label}>PAN required above (₹)</label>
              <input
                className={field}
                inputMode="decimal"
                value={String(values.panRequiredAboveAmount)}
                onChange={(e) =>
                  set("panRequiredAboveAmount", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
                }
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Withdrawals above this amount need a PAN on file, for TDS. Set 0 to never require
                one.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <span className={label}>Payout methods offered</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {PAYOUT_METHODS.map((method) => {
                const enabled = values.payoutMethods.includes(method.value);
                return (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      enabled ? "border-violet-300 bg-violet-50/50 text-slate-900" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        set(
                          "payoutMethods",
                          e.target.checked
                            ? [...values.payoutMethods, method.value]
                            : values.payoutMethods.filter((value) => value !== method.value)
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {method.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Turning a method off stops new requests using it. Requests already in the queue are
              unaffected.
            </p>
          </div>

          <SaveBar
            keys={[
              "minWithdrawalAmount",
              "maxWithdrawalAmount",
              "panRequiredAboveAmount",
              "payoutMethods",
            ]}
          />
        </Card>
      )}

      {tab === "seo" && (
        <Card title="SEO" subtitle="Defaults for pages that don't set their own metadata">
          <div className="space-y-4">
            <div>
              <label className={label}>Default page title</label>
              <input className={field} value={values.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </div>
            <div>
              <label className={label}>Default meta description</label>
              <textarea
                className={`${field} min-h-[80px]`}
                value={values.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <Toggle
              checked={values.searchIndexingEnabled}
              onChange={(next) => set("searchIndexingEnabled", next)}
              title="Allow search engines to index the site"
              description="Off emits a site-wide Disallow in robots.txt — use it for staging or pre-launch."
              tone="amber"
            />
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
            <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />
            Canonical URLs are built from <code className="text-violet-700">{system.siteUrl}</code>,
            which comes from the environment, not this page — a wrong value here would point
            canonicals at the wrong host.
          </p>

          <SaveBar keys={["seoTitle", "seoDescription", "searchIndexingEnabled"]} />
        </Card>
      )}

      {tab === "integrations" && (
        <div className="space-y-6">
          <Card title="Cuelinks" subtitle="Configured through environment variables, shown here read-only">
            <Fact
              label="API key"
              value={
                system.cuelinksConfigured ? (
                  <span className="text-cashlime-700">Configured</span>
                ) : (
                  <span className="text-amber-700">Not set — running in stub mode</span>
                )
              }
            />
            <Fact label="Channel ID" value={system.cuelinksChannel ?? "Not set"} />
            <Fact
              label="Postback secret"
              value={
                system.postbackSecretSet ? (
                  <span className="text-cashlime-700">Set</span>
                ) : (
                  <span className="text-amber-700">Not set — postbacks are unauthenticated</span>
                )
              }
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cuelinks Global Postback URL
              </p>
              <code className="mt-1.5 block break-all text-sm text-slate-800">
                {system.postbackUrl}
              </code>
              <p className="mt-2 text-xs text-slate-500">
                Paste this into the Destination URL field on the Cuelinks postback form.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/admin/campaigns"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Browse campaigns
              </Link>
            </div>
          </Card>

          <Card title="Redis" subtitle="Optional cache">
            <Fact
              label="Status"
              value={
                system.redisConfigured ? (
                  <span className="text-cashlime-700">Connected</span>
                ) : (
                  "Not configured — the app runs without it"
                )
              }
            />
          </Card>
        </div>
      )}

      {tab === "system" && (
        <div className="space-y-6">
          <Card title="System Information" subtitle="Live values from this running instance">
            <Fact label="Runtime" value={system.runtime} />
            <Fact label="Environment" value={system.environment} />
            <Fact label="Database" value={system.database} />
            <Fact label="Site URL" value={system.siteUrl} />
            <Fact label="Server time" value={system.serverTime} />
          </Card>

          <Card title="Audit & Logs" subtitle="Every settings change is recorded">
            <p className="text-sm text-slate-600">
              Admin actions — settings changes, payouts, user status changes, content edits — are
              written to the activity log with who did them and when.
            </p>
            <Link
              href="/admin/activity-logs"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View activity logs
              <ExternalLink size={13} strokeWidth={2} />
            </Link>
          </Card>

          <Card title="Backups" subtitle="Handled outside the application">
            <p className="text-sm text-slate-600">
              There is no in-app backup button, because a real backup is a database-level dump and
              running one from a web request would be unreliable and easy to trigger by accident.
              Back up Postgres on your host or hosting provider, and test a restore before you need
              one.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
