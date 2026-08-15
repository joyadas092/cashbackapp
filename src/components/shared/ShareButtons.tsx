"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareButtons({ url, message }: { url: string; message: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(url);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      <a href={`https://wa.me/?text=${text}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outlineLight" size="sm">
          WhatsApp
        </Button>
      </a>
      <a href={`https://t.me/share/url?url=${encodedUrl}&text=${text}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outlineLight" size="sm">
          Telegram
        </Button>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outlineLight" size="sm">
          Facebook
        </Button>
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outlineLight" size="sm">
          X
        </Button>
      </a>
    </div>
  );
}
