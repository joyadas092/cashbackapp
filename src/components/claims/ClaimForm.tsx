"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { CLAIM_ORDER_TYPE_META } from "@/lib/claims";

type OrderType = "OWN_ORDER" | "AFFILIATE_ORDER";

interface EligibleClick {
  id: string;
  shortId: string;
  createdAt: string;
  store: { id: string; name: string; slug: string; logoUrl: string };
  linkCode: string | null;
  alreadyTracked: boolean;
  alreadyClaimed: boolean;
}

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400";
const label = "text-sm font-semibold text-slate-800";

/** yyyy-mm-dd for <input type="date">, in the viewer's own timezone. */
function toDateInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function ClaimForm({ windowDays, minAgeHours }: { windowDays: number; minAgeHours: number }) {
  const router = useRouter();

  const [orderType, setOrderType] = useState<OrderType>("OWN_ORDER");
  const [date, setDate] = useState("");
  const [clicks, setClicks] = useState<EligibleClick[]>([]);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [clickId, setClickId] = useState("");

  const [orderId, setOrderId] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = toDateInput(new Date());
  const earliest = toDateInput(new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000));

  // Clicks are fetched per date+type; changing either invalidates the choice
  // made below it, so the cascade resets rather than keeping a stale click.
  const loadClicks = useCallback(async () => {
    if (!date) {
      setClicks([]);
      return;
    }
    setLoadingClicks(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/claims/clicks?date=${encodeURIComponent(date)}&orderType=${orderType}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load your clicks");
      setClicks(body.items ?? []);
    } catch (e) {
      setClicks([]);
      setError(e instanceof Error ? e.message : "Could not load your clicks");
    } finally {
      setLoadingClicks(false);
    }
  }, [date, orderType]);

  useEffect(() => {
    setStoreId("");
    setClickId("");
    void loadClicks();
  }, [loadClicks]);

  // The stores touched on the chosen day, derived from the clicks themselves —
  // this is the "system shows which store they clicked on" step.
  const stores = Array.from(
    new Map(clicks.map((click) => [click.store.id, click.store])).values()
  );
  const clicksForStore = clicks.filter((click) => click.store.id === storeId);
  const selectedClick = clicks.find((click) => click.id === clickId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clickId) {
      setError("Choose the click this order came from.");
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.set("orderType", orderType);
    body.set("clickId", clickId);
    body.set("orderId", orderId);
    body.set("orderAmount", orderAmount);
    body.set("message", message);
    if (screenshot) body.set("screenshot", screenshot);

    try {
      const res = await fetch("/api/claims", { method: "POST", body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not raise your claim");
      router.push(`/dashboard/claims?raised=${encodeURIComponent(result.claimNumber)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not raise your claim");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* --- 1. What kind of order --- */}
      <section className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-slate-900">1. What are you claiming for?</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {(Object.keys(CLAIM_ORDER_TYPE_META) as OrderType[]).map((value) => {
            const meta = CLAIM_ORDER_TYPE_META[value];
            const active = orderType === value;
            return (
              <label
                key={value}
                className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
                  active
                    ? "border-violet-400 bg-violet-50/60"
                    : "border-slate-200 hover:border-violet-200"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="orderType"
                    value={value}
                    checked={active}
                    onChange={() => setOrderType(value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
                </span>
                <span className="mt-1.5 block pl-6.5 text-xs text-slate-500">{meta.help}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* --- 2. When --- */}
      <section className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-slate-900">2. When did you shop?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick the date. We&apos;ll show the stores you visited that day.
        </p>
        <input
          type="date"
          value={date}
          min={earliest}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date you shopped"
          className={`${field} mt-3 sm:max-w-xs`}
        />
        <p className="mt-2 text-xs text-slate-400">
          Claims can be raised from {minAgeHours} hours up to {windowDays} days after a click.
        </p>
      </section>

      {/* --- 3. Which store, then which click --- */}
      <section className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-slate-900">3. Which store and click?</h2>

        {!date ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            Pick a date above first.
          </p>
        ) : loadingClicks ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={15} className="animate-spin" />
            Looking up your clicks…
          </p>
        ) : clicks.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No claimable clicks on that date. Try another day, or{" "}
            <Link href="/dashboard/activity?tab=own-clicks" className="font-semibold text-violet-700 hover:underline">
              check your click history
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-3">
              <span className={label}>Store</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {stores.map((store) => {
                  const active = storeId === store.id;
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        setStoreId(store.id);
                        setClickId("");
                      }}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? "border-violet-400 bg-violet-50/60"
                          : "border-slate-200 hover:border-violet-200"
                      }`}
                    >
                      <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                        <StoreLogo
                          src={store.logoUrl}
                          alt={store.name}
                          size={28}
                          fallbackSlug={store.slug}
                        />
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {store.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {storeId && (
              <div className="mt-4">
                <label htmlFor="claim-click" className={label}>
                  Time &amp; click ID
                </label>
                <select
                  id="claim-click"
                  value={clickId}
                  onChange={(e) => setClickId(e.target.value)}
                  className={`${field} mt-2`}
                >
                  <option value="">Choose the click…</option>
                  {clicksForStore.map((click) => (
                    <option
                      key={click.id}
                      value={click.id}
                      disabled={click.alreadyTracked || click.alreadyClaimed}
                    >
                      {new Date(click.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {click.shortId}
                      {click.alreadyTracked ? " · already tracked" : ""}
                      {click.alreadyClaimed ? " · already claimed" : ""}
                    </option>
                  ))}
                </select>

                {selectedClick && (
                  <p className="mt-2 text-xs text-slate-500">
                    Claiming against click{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {selectedClick.shortId}
                    </span>
                    {selectedClick.linkCode && <> from your link /p/{selectedClick.linkCode}</>}.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* --- 4. Order details --- */}
      <section className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-slate-900">4. Order details</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="claim-order" className={label}>
              Order ID
            </label>
            <input
              id="claim-order"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="OD1234567890"
              required
              className={`${field} mt-1.5`}
            />
            <p className="mt-1 text-xs text-slate-400">Exactly as it appears on the store.</p>
          </div>
          <div>
            <label htmlFor="claim-amount" className={label}>
              Order amount (₹)
            </label>
            <input
              id="claim-amount"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="2499"
              required
              className={`${field} mt-1.5`}
            />
          </div>
        </div>

        <div className="mt-4">
          <span className={label}>Screenshot of the order</span>
          <p className="mt-0.5 text-xs text-slate-400">
            PNG, JPG or WebP, up to 5MB. Optional, but claims with proof are resolved faster.
          </p>

          {screenshot ? (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
              <CheckCircle2 size={16} strokeWidth={2} className="shrink-0 text-cashlime-600" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {screenshot.name}
              </span>
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                aria-label="Remove screenshot"
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm font-medium text-slate-500 hover:border-violet-300 hover:text-violet-700">
              <Upload size={16} strokeWidth={2} />
              Choose a screenshot
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="claim-message" className={label}>
            What happened?
          </label>
          <textarea
            id="claim-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            placeholder="I shopped through the app but the cashback never appeared in my activity."
            className={`${field} mt-1.5 resize-y`}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting || !clickId}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? "Raising claim…" : "Raise Claim"}
        </button>
        <Link
          href="/dashboard/claims"
          className="text-center text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
