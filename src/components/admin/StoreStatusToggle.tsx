"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function StoreStatusToggle({ storeId, status }: { storeId: string; status: "ACTIVE" | "INACTIVE" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    const next = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/admin/stores/${storeId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Failed to update status");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={status === "ACTIVE" ? "outline" : "secondary"} size="sm" onClick={toggle} disabled={loading}>
        {loading ? "..." : status === "ACTIVE" ? "Deactivate" : "Activate"}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
