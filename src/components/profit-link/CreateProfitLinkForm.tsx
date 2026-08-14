"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StoreLogo } from "@/components/store/StoreLogo";
import { ShareButtons } from "@/components/shared/ShareButtons";

interface CreatedLink {
  code: string;
  shareUrl: string;
  store: { name: string; slug: string; logoUrl: string };
  cashbackDisplayText: string;
}

export function CreateProfitLinkForm({ onCreated }: { onCreated?: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedLink | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/profit-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create an earning link for that URL.");
      return;
    }

    setResult(body);
    setUrl("");
    onCreated?.();
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">Turn product links into earning links.</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a product or store URL"
          required
          className="flex-1"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Creating..." : "Create Earning Link"}
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-5 rounded-xl2 border border-white/10 bg-navy-900/60 p-4">
          <div className="flex items-center gap-3">
            <StoreLogo src={result.store.logoUrl} alt={result.store.name} size={40} />
            <div>
              <div className="font-semibold text-white">{result.store.name}</div>
              <div className="text-sm text-cashlime-400">{result.cashbackDisplayText}</div>
            </div>
          </div>
          <p className="mt-3 break-all rounded-lg bg-black/30 px-3 py-2 text-sm text-white/70">
            {result.shareUrl}
          </p>
          <p className="mt-2 text-xs text-white/50">
            Share this link. When someone shops through it, you earn according to the store&apos;s
            earning rules.
          </p>
          <div className="mt-3">
            <ShareButtons url={result.shareUrl} message={`Check out this deal at ${result.store.name}!`} />
          </div>
        </div>
      )}
    </Card>
  );
}
