"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Check, Landmark, Smartphone, Wallet as WalletIcon } from "lucide-react";
import { formatInrExact } from "@/lib/utils";

type Method = "UPI" | "BANK_TRANSFER" | "PAYTM" | "AMAZON_PAY";

const METHODS: Array<{
  key: Method;
  label: string;
  speed: string;
  icon: typeof WalletIcon;
  destinationLabel: string;
  placeholder: string;
  note: string;
}> = [
  {
    key: "UPI",
    label: "UPI",
    speed: "Instant Transfer",
    icon: Smartphone,
    destinationLabel: "UPI ID",
    placeholder: "name@bank",
    note: "You will receive the amount in your UPI account.",
  },
  {
    key: "BANK_TRANSFER",
    label: "Bank Transfer",
    speed: "2-3 Working Days",
    icon: Landmark,
    destinationLabel: "Account reference",
    placeholder: "Account nickname or last 4 digits",
    note: "Never enter your full account number here — our team will contact you to confirm details.",
  },
  {
    key: "PAYTM",
    label: "Paytm",
    speed: "Instant Transfer",
    icon: WalletIcon,
    destinationLabel: "Paytm number",
    placeholder: "Registered mobile number",
    note: "Sent to your Paytm wallet.",
  },
  {
    key: "AMAZON_PAY",
    label: "Amazon Pay",
    speed: "Instant Transfer",
    icon: Banknote,
    destinationLabel: "Amazon account email",
    placeholder: "you@example.com",
    note: "Issued as an Amazon Pay balance top-up.",
  },
];

export function WithdrawForm({
  availableBalance,
  minWithdrawal,
}: {
  availableBalance: number;
  minWithdrawal: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("UPI");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const active = METHODS.find((m) => m.key === method)!;
  const belowMinimum = availableBalance < minWithdrawal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/wallet/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method, destination }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not submit that request." });
      return;
    }

    setMessage({
      kind: "ok",
      text: `Requested ${formatInrExact(body.amount)}. It's reserved from your balance while we process it.`,
    });
    setAmount("");
    setDestination("");
    router.refresh(); // pull the new balance and ledger row
  }

  return (
    <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Withdraw Money</h2>

      <form onSubmit={handleSubmit} className="mt-5">
        <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
          <div>
            <div className="text-sm text-slate-500">Available Balance</div>
            <div className="mt-1 text-3xl font-extrabold text-cashlime-600">
              {formatInrExact(availableBalance)}
            </div>
            <div className="mt-2 text-sm text-slate-500">Choose withdrawal method</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {METHODS.map((m) => {
              const selected = m.key === method;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  aria-pressed={selected}
                  className={`relative rounded-xl border p-3.5 text-left transition-colors ${
                    selected
                      ? "border-violet-500 bg-violet-50/50 ring-1 ring-violet-500"
                      : "border-slate-200 hover:border-violet-300"
                  }`}
                >
                  {selected && (
                    <Check
                      size={16}
                      strokeWidth={3}
                      className="absolute right-2.5 top-2.5 text-violet-600"
                    />
                  )}
                  <m.icon size={20} strokeWidth={1.75} className="text-slate-500" />
                  <div className="mt-2 text-sm font-bold text-slate-900">{m.label}</div>
                  <div className="text-xs text-slate-500">{m.speed}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-end">
          <div>
            <label htmlFor="wd-destination" className="text-sm font-medium text-slate-700">
              {active.destinationLabel}
            </label>
            <input
              id="wd-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              placeholder={active.placeholder}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="wd-amount" className="text-sm font-medium text-slate-700">
              Amount
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₹
              </span>
              <input
                id="wd-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                inputMode="decimal"
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-8 pr-14 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setAmount(String(availableBalance))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-700 hover:underline"
              >
                All
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || belowMinimum}
            className="h-[46px] rounded-xl bg-violet-600 px-8 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Withdraw Now"}
          </button>
        </div>

        <p className="mt-2.5 text-xs text-slate-500">
          {belowMinimum
            ? `You need at least ${formatInrExact(minWithdrawal)} available to withdraw.`
            : active.note}
        </p>

        {message && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              message.kind === "ok"
                ? "bg-cashlime-50 text-cashlime-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </form>
    </section>
  );
}
