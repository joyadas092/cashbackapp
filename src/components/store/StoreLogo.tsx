"use client";

import { useState } from "react";

/**
 * Store logos come from three places, best-first: an admin-pasted URL, the
 * Cuelinks campaign `image` field, or Google's favicon service (see
 * src/lib/logo.ts). All three are remote and can fail or be blocked, so this
 * falls back to the local monogram SVG in public/logos rather than showing a
 * broken image. Plain <img> rather than next/image: these are already
 * 128px-or-smaller marks, and onError fallback needs a client boundary anyway.
 */
export function StoreLogo({
  src,
  alt,
  size = 56,
  fallbackSlug,
}: {
  src: string;
  alt: string;
  size?: number;
  fallbackSlug?: string;
}) {
  const [failed, setFailed] = useState(false);
  const fallback = fallbackSlug ? `/logos/${fallbackSlug}.svg` : null;
  const resolved = failed && fallback ? fallback : src;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        className="h-full w-full object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
