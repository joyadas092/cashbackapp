"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

/** Reply box on a ticket thread. Used by both the user view and the admin view;
 *  the API decides whether the reply is recorded as a staff reply. */
export function TicketReplyForm({
  ticketId,
  variant = "light",
  placeholder = "Type your reply...",
}: {
  ticketId: string;
  variant?: "light" | "dark";
  placeholder?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const payload = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setError(payload.error ?? "Could not post that reply.");
      return;
    }

    setBody("");
    router.refresh();
  }

  const isDark = variant === "dark";

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
        maxLength={5000}
        placeholder={placeholder}
        className={
          isDark
            ? "w-full resize-y rounded-xl border border-white/15 bg-navy-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-500"
            : "w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
        }
      />

      {error && (
        <p
          className={
            isDark
              ? "mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300"
              : "mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          }
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || body.trim().length === 0}
        className="mt-3 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
      >
        <Send size={15} strokeWidth={2} />
        {sending ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
}
