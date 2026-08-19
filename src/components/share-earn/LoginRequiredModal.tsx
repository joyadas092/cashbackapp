"use client";

import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Shown when a logged-out visitor tries to generate a profit link. Earnings are
 * credited to an account, so there is nothing useful we can do without one —
 * but the page itself stays public and crawlable, and this only interrupts at
 * the point where an account actually becomes necessary.
 */
export function LoginRequiredModal({
  open,
  onClose,
  callbackUrl,
}: {
  open: boolean;
  onClose: () => void;
  callbackUrl: string;
}) {
  if (!open) return null;

  const encoded = encodeURIComponent(callbackUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl2 border border-slate-200 bg-white p-6 text-center shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Lock size={22} strokeWidth={1.75} />
        </span>
        <h3 id="login-required-title" className="mt-3 text-lg font-bold text-slate-900">
          Log in to create your link
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Profit links are tied to your account — that&apos;s how we know who to pay when
          someone buys through your link. It takes a minute to set up.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a href={`/login?callbackUrl=${encoded}`}>
            <Button variant="primary" className="w-full">
              Log In
            </Button>
          </a>
          <a href={`/register?callbackUrl=${encoded}`}>
            <Button variant="outlineLight" className="w-full">
              Create a Free Account
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
