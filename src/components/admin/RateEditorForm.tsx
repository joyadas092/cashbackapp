"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CashbackRuleEditor, DEFAULT_RULE, type CashbackRuleValue } from "./CashbackRuleEditor";

export function RateEditorForm({
  storeId,
  initial,
}: {
  storeId: string;
  initial: CashbackRuleValue | null;
}) {
  const router = useRouter();
  const [rule, setRule] = useState<CashbackRuleValue>(initial ?? DEFAULT_RULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/admin/stores/${storeId}/cashback-rule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to save");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <CashbackRuleEditor value={rule} onChange={setRule} />
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Rules"}
        </Button>
        <Button variant="outline" onClick={() => setRule(initial ?? DEFAULT_RULE)}>
          Reset
        </Button>
        {saved && <span className="text-sm text-cashlime-700">Saved.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
