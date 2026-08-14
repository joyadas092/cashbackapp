"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Spec section 41: when a logged-out user clicks "Earn Cashback", warn them
 * before redirecting rather than silently dropping attribution.
 */
export function LoginPromptModal({
  storeSlug,
  storeName,
  trigger,
}: {
  storeSlug: string;
  storeName: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-2xl">🔐</div>
            <h3 className="mt-3 text-lg font-bold text-white">
              Login to protect your cashback
            </h3>
            <p className="mt-2 text-sm text-white/60">
              You&apos;re currently not logged in. If you continue without logging in, we
              can&apos;t associate this {storeName} shopping trip with your account and you
              may miss cashback.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a href={`/login?callbackUrl=${encodeURIComponent(`/go/${storeSlug}?intent=cashback`)}`}>
                <Button variant="primary" className="w-full">
                  Login &amp; Earn Cashback
                </Button>
              </a>
              <a href={`/go/${storeSlug}?intent=visit`}>
                <Button variant="outline" className="w-full">
                  Continue Without Cashback
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
