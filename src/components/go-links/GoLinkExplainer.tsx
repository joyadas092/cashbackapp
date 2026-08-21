"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Keyboard, Share2, Wallet } from "lucide-react";

/**
 * The pitch for goURLs.
 *
 * A goURL is unusual enough to need explaining: nothing has to be generated,
 * nothing has to be clicked, and the same address behaves differently depending
 * on who opens it. Showing the actual URL with the user's own handle in it does
 * more of that explaining than a paragraph would.
 */
export function GoLinkExplainer({
  handle,
  userCode,
  hasCustomUsername,
  baseUrl,
}: {
  handle: string;
  userCode: string;
  hasCustomUsername: boolean;
  baseUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const sample = `${baseUrl.replace(/^https?:\/\//, "")}/go/${handle}/flipkart`;

  async function copy() {
    await navigator.clipboard.writeText(`${baseUrl}/go/${handle}/flipkart`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    {
      icon: Keyboard,
      title: "Type it anywhere",
      body: "Put the address straight into your browser's address bar. No app, no login screen, no searching for the store.",
    },
    {
      icon: Wallet,
      title: "Shop as normal",
      body: "You land on the store. Buy what you came for and the cashback tracks to your wallet.",
    },
    {
      icon: Share2,
      title: "Or share it",
      body: "Send the same link to a friend. When they buy through it, you earn — they don't even need an account.",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl2 border border-violet-200 bg-violet-50/50">
      <div className="p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Your goURL format
        </p>

        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all rounded-xl border border-violet-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800">
            {sample}
          </code>
          <button
            type="button"
            onClick={copy}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            {copied ? (
              <>
                <Check size={15} strokeWidth={2.5} />
                Copied
              </>
            ) : (
              <>
                <Copy size={15} strokeWidth={2} />
                Copy
              </>
            )}
          </button>
        </div>

        <p className="mt-2.5 text-xs text-slate-500">
          Swap <span className="font-semibold text-slate-700">flipkart</span> for any store below.
          {hasCustomUsername ? (
            <>
              {" "}
              Your permanent code{" "}
              <span className="font-mono font-semibold text-slate-700">{userCode}</span> works too,
              so older links keep going even if you change your username.
            </>
          ) : (
            <>
              {" "}
              <Link
                href="/dashboard/profile"
                className="font-semibold text-violet-700 hover:underline"
              >
                Pick a username
              </Link>{" "}
              to make it easier to remember.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-px border-t border-violet-200 bg-violet-200 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="bg-white p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <step.icon size={16} strokeWidth={2} />
            </span>
            <p className="mt-2.5 text-sm font-bold text-slate-900">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
