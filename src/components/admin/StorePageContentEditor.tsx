"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ExternalLink, Plus, Trash2 } from "lucide-react";

export interface RateRow {
  label: string;
  displayText: string;
}

export interface OfferRow {
  badge: string;
  title: string;
  description: string;
  code: string;
  validTill: string; // yyyy-mm-dd, "" for no expiry
}

export interface StorePageContentEditorProps {
  storeId: string;
  storeSlug: string;
  storeName: string;
  initial: {
    tagline: string;
    previousRate: string;
    visitTime: string;
    trackingTime: string;
    paymentTime: string;
    description: string;
    terms: string;
    storePolicies: string;
    importantTips: string[];
    categoryRates: RateRow[];
    offers: OfferRow[];
  };
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500";
const label = "block text-xs font-medium uppercase tracking-wide text-slate-500";

/** Move an item within a list, returning a new array. */
function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function StorePageContentEditor({
  storeId,
  storeSlug,
  storeName,
  initial,
}: StorePageContentEditorProps) {
  const [tagline, setTagline] = useState(initial.tagline);
  const [previousRate, setPreviousRate] = useState(initial.previousRate);
  const [visitTime, setVisitTime] = useState(initial.visitTime);
  const [trackingTime, setTrackingTime] = useState(initial.trackingTime);
  const [paymentTime, setPaymentTime] = useState(initial.paymentTime);
  const [description, setDescription] = useState(initial.description);
  const [terms, setTerms] = useState(initial.terms);
  const [storePolicies, setStorePolicies] = useState(initial.storePolicies);
  const [tips, setTips] = useState<string[]>(initial.importantTips);
  const [rates, setRates] = useState<RateRow[]>(initial.categoryRates);
  const [offers, setOffers] = useState<OfferRow[]>(initial.offers);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const res = await fetch(`/api/admin/stores/${storeId}/page-content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tagline,
        previousRate: previousRate.trim() === "" ? null : previousRate,
        visitTime,
        trackingTime,
        paymentTime,
        description,
        terms,
        storePolicies,
        // Blank rows are the natural result of adding a field and changing your
        // mind, so drop them here rather than failing validation on the server.
        importantTips: tips.map((t) => t.trim()).filter(Boolean),
        categoryRates: rates
          .filter((r) => r.label.trim() && r.displayText.trim())
          .map((r) => ({ label: r.label.trim(), displayText: r.displayText.trim() })),
        offers: offers
          .filter((o) => o.title.trim())
          .map((o) => ({
            badge: o.badge.trim() || null,
            title: o.title.trim(),
            description: o.description.trim() || null,
            code: o.code.trim() || null,
            validTill: o.validTill.trim() || null,
          })),
      }),
    });

    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not save." });
      return;
    }
    setMessage({ kind: "ok", text: "Saved. The store page is live with these changes." });
  }

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{storeName} — Page Content</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything here is per-store. Cuelinks supplies a single flat rate and no coupons, so
            this content is maintained here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/stores/${storeSlug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline"
          >
            View page
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

      {/* --- Header block --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Header</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Tagline (under the store name)</label>
            <input
              className={`${field} mt-1.5`}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="India's leading online shopping destination for mobiles, electronics, fashion & more."
            />
          </div>
          <div>
            <label className={label}>Previous rate % (shows the &ldquo;Was X%&rdquo; chip)</label>
            <input
              className={`${field} mt-1.5`}
              value={previousRate}
              onChange={(e) => setPreviousRate(e.target.value)}
              placeholder="6"
              inputMode="decimal"
            />
            <p className="mt-1 text-xs text-slate-400">
              The chip only appears when the current rate is higher than this.
            </p>
          </div>
          <div>
            <label className={label}>Visit time</label>
            <input
              className={`${field} mt-1.5`}
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              placeholder="7 Days"
            />
          </div>
          <div>
            <label className={label}>Tracking time</label>
            <input
              className={`${field} mt-1.5`}
              value={trackingTime}
              onChange={(e) => setTrackingTime(e.target.value)}
              placeholder="24 - 48 Hours"
            />
          </div>
          <div>
            <label className={label}>Payment time</label>
            <input
              className={`${field} mt-1.5`}
              value={paymentTime}
              onChange={(e) => setPaymentTime(e.target.value)}
              placeholder="60 - 90 Days"
            />
          </div>
        </div>
      </section>

      {/* --- Cashback rate table --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Cashback Rates by Category</h2>
            <p className="mt-1 text-sm text-slate-500">
              The sidebar table. Leave empty to fall back to the store&apos;s single headline rate.
            </p>
          </div>
          <button
            onClick={() => setRates([...rates, { label: "", displayText: "" }])}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add row
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {rates.length === 0 && (
            <p className="text-sm text-slate-400">No category rates yet.</p>
          )}
          {rates.map((rate, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={field}
                value={rate.label}
                onChange={(e) =>
                  setRates(rates.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                }
                placeholder="Mobiles & Tablets"
              />
              <input
                className={`${field} max-w-[160px]`}
                value={rate.displayText}
                onChange={(e) =>
                  setRates(
                    rates.map((r, j) => (j === i ? { ...r, displayText: e.target.value } : r))
                  )
                }
                placeholder="Up to 8%"
              />
              <button
                onClick={() => setRates(move(rates, i, i - 1))}
                disabled={i === 0}
                title="Move up"
                className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-30"
              >
                <ArrowUp size={14} strokeWidth={2} />
              </button>
              <button
                onClick={() => setRates(move(rates, i, i + 1))}
                disabled={i === rates.length - 1}
                title="Move down"
                className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-30"
              >
                <ArrowDown size={14} strokeWidth={2} />
              </button>
              <button
                onClick={() => setRates(rates.filter((_, j) => j !== i))}
                title="Remove"
                className="rounded-lg border border-slate-300 p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* --- Offers --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Best Offers for You</h2>
            <p className="mt-1 text-sm text-slate-500">
              Coupon cards in the sidebar. Cuelinks returns no offers for most of our campaigns.
            </p>
          </div>
          <button
            onClick={() =>
              setOffers([
                ...offers,
                { badge: "EXTRA", title: "", description: "", code: "", validTill: "" },
              ])
            }
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add offer
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {offers.length === 0 && <p className="text-sm text-slate-400">No offers yet.</p>}
          {offers.map((offer, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-[100px_1fr_140px]">
                <input
                  className={field}
                  value={offer.badge}
                  onChange={(e) =>
                    setOffers(offers.map((o, j) => (j === i ? { ...o, badge: e.target.value } : o)))
                  }
                  placeholder="EXTRA"
                />
                <input
                  className={field}
                  value={offer.title}
                  onChange={(e) =>
                    setOffers(offers.map((o, j) => (j === i ? { ...o, title: e.target.value } : o)))
                  }
                  placeholder="Extra 2% Cashback"
                />
                <input
                  className={field}
                  value={offer.code}
                  onChange={(e) =>
                    setOffers(offers.map((o, j) => (j === i ? { ...o, code: e.target.value } : o)))
                  }
                  placeholder="GET2"
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                <input
                  className={field}
                  value={offer.description}
                  onChange={(e) =>
                    setOffers(
                      offers.map((o, j) => (j === i ? { ...o, description: e.target.value } : o))
                    )
                  }
                  placeholder="On all prepaid orders"
                />
                <input
                  type="date"
                  className={field}
                  value={offer.validTill}
                  onChange={(e) =>
                    setOffers(
                      offers.map((o, j) => (j === i ? { ...o, validTill: e.target.value } : o))
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffers(move(offers, i, i - 1))}
                    disabled={i === 0}
                    title="Move up"
                    className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowUp size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setOffers(move(offers, i, i + 1))}
                    disabled={i === offers.length - 1}
                    title="Move down"
                    className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowDown size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setOffers(offers.filter((_, j) => j !== i))}
                    title="Remove"
                    className="rounded-lg border border-slate-300 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Important tips --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Important Tips</h2>
            <p className="mt-1 text-sm text-slate-500">
              The green checklist. Leave empty to use the standard set.
            </p>
          </div>
          <button
            onClick={() => setTips([...tips, ""])}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add tip
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {tips.length === 0 && (
            <p className="text-sm text-slate-400">Using the standard tips.</p>
          )}
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={field}
                value={tip}
                onChange={(e) => setTips(tips.map((t, j) => (j === i ? e.target.value : t)))}
                placeholder="Click on Earn Cashback and complete your purchase in the same session."
              />
              <button
                onClick={() => setTips(tips.filter((_, j) => j !== i))}
                title="Remove"
                className="rounded-lg border border-slate-300 p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* --- Long-form tab copy --- */}
      <section className="rounded-xl2 border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Tab Content</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className={label}>About {storeName}</label>
            <textarea
              className={`${field} mt-1.5 min-h-[100px] rounded-lg`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`${storeName} is one of India's largest e-commerce platforms...`}
            />
          </div>
          <div>
            <label className={label}>Terms &amp; Conditions</label>
            <textarea
              className={`${field} mt-1.5 min-h-[100px] rounded-lg`}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Leave blank to show the Important Tips list instead."
            />
          </div>
          <div>
            <label className={label}>Store Policies</label>
            <textarea
              className={`${field} mt-1.5 min-h-[100px] rounded-lg`}
              value={storePolicies}
              onChange={(e) => setStorePolicies(e.target.value)}
              placeholder="Leave blank to show the standard returns/refunds wording."
            />
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
