"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { TICKET_CATEGORIES } from "@/lib/support";

const field =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white";
const label = "text-sm font-medium text-slate-700";

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(TICKET_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, category, message }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitting(false);
      setError(body.error ?? "Could not raise that ticket.");
      return;
    }

    // Straight into the thread, so the user sees their message recorded rather
    // than a bare success toast.
    router.push(`/dashboard/help/tickets/${body.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tk-category" className={label}>
            What&apos;s this about?
          </label>
          <select
            id="tk-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={field}
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tk-subject" className={label}>
            Subject
          </label>
          <input
            id="tk-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={150}
            placeholder="Cashback not confirmed for my Flipkart order"
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tk-message" className={label}>
            Tell us what happened
          </label>
          <textarea
            id="tk-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={5000}
            rows={7}
            placeholder="Include the store, order ID and date if you have them — it helps us trace the order much faster."
            className={`${field} resize-y`}
          />
          <p className="mt-1 text-xs text-slate-400">
            Never share your password or full bank account number here. Our team will never ask for
            them.
          </p>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
      >
        <Send size={15} strokeWidth={2} />
        {submitting ? "Sending..." : "Submit Ticket"}
      </button>
    </form>
  );
}
