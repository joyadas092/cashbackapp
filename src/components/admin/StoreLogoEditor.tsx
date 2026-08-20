"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function StoreLogoEditor({ storeId, logoUrl }: { storeId: string; logoUrl: string }) {
  const router = useRouter();
  const [value, setValue] = useState(logoUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (value === logoUrl) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/stores/${storeId}/logo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: value }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(body.error ?? "Failed to save logo");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={value || "/logos/flipkart.svg"}
        alt=""
        className="h-8 w-8 shrink-0 rounded bg-white object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste logo URL"
        className="w-48 !py-1.5 text-xs"
      />
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || value === logoUrl}>
        {saving ? "..." : "Save"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
