"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Share2 } from "lucide-react";

export interface StoreActionButtonsProps {
  storeSlug: string;
  storeName: string;
  cashbackDisplayText: string;
  isLoggedIn: boolean;
  initiallyFavorited: boolean;
}

/**
 * The "Add to Favorites" / "Share Store" pair from the store hero.
 *
 * Favorite state is optimistic — the toggle flips immediately and reverts if the
 * request fails, so the button never feels laggy on a slow connection.
 */
export function StoreActionButtons({
  storeSlug,
  storeName,
  cashbackDisplayText,
  isLoggedIn,
  initiallyFavorited,
}: StoreActionButtonsProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [pending, setPending] = useState(false);
  const [shared, setShared] = useState(false);

  async function toggleFavorite() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/stores/${storeSlug}`);
      return;
    }

    const next = !favorited;
    setFavorited(next);
    setPending(true);

    const res = await fetch(`/api/stores/${storeSlug}/favorite`, { method: "POST" }).catch(
      () => null
    );
    setPending(false);

    if (!res?.ok) {
      setFavorited(!next); // roll back — the server never recorded it
      return;
    }
    const body = await res.json().catch(() => null);
    if (body && typeof body.favorited === "boolean") setFavorited(body.favorited);
  }

  async function shareStore() {
    const url = `${window.location.origin}/stores/${storeSlug}`;
    const text = `Earn ${cashbackDisplayText} cashback at ${storeName}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, text, url });
        return;
      } catch {
        // User dismissed the sheet — fall through to copying instead.
      }
    }

    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={pending}
        aria-pressed={favorited}
        className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
          favorited
            ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-500"
            : "border-violet-300 text-violet-700 hover:bg-violet-50"
        }`}
      >
        <Heart size={17} strokeWidth={2} fill={favorited ? "currentColor" : "none"} />
        {favorited ? "Saved to Favorites" : "Add to Favorites"}
      </button>

      <button
        type="button"
        onClick={shareStore}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        {shared ? (
          <>
            <Check size={17} strokeWidth={2.5} className="text-cashlime-600" />
            Link copied
          </>
        ) : (
          <>
            <Share2 size={17} strokeWidth={2} />
            Share Store
          </>
        )}
      </button>
    </>
  );
}
