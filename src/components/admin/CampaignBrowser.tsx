"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CashbackRuleEditor, DEFAULT_RULE, type CashbackRuleValue } from "./CashbackRuleEditor";
import { publicLogoUrl } from "@/lib/logo";

interface Campaign {
  campaignId: string;
  name: string;
  status: string;
  imageUrl?: string;
  domain?: string;
  payoutType?: string;
  payout?: string;
  imported: boolean;
  linkedStoreId: string | null;
}

interface StoreOption {
  id: string;
  name: string;
  slug: string;
  merchantDomains: string[];
}

interface CategoryOption {
  id: string;
  name: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CampaignBrowser({
  categories,
  stores,
}: {
  categories: CategoryOption[];
  stores: StoreOption[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<{ campaignId: string; mode: "link" | "create" } | null>(null);

  async function loadCampaigns() {
    setError(null);
    setCampaigns(null);
    const res = await fetch("/api/admin/cuelinks/campaigns");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Failed to load campaigns");
      return;
    }
    setCampaigns(body.campaigns);
  }

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={loadCampaigns}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!campaigns) {
    return <p className="text-sm text-slate-500">Loading campaigns from Cuelinks...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {campaigns.map((c) => (
        <Card key={c.campaignId} className="p-4">
          <div className="flex items-center gap-3">
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt={c.name} className="h-10 w-10 rounded-lg bg-white object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                No logo
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-500">
                {c.domain ?? "unknown domain"} {c.payout && `· payout ${c.payout}`}
              </div>
            </div>
            {c.imported ? (
              <span className="rounded-full bg-cashlime-500/15 px-3 py-1 text-xs font-semibold text-cashlime-700">
                Imported
              </span>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOpenPanel(
                      openPanel?.campaignId === c.campaignId && openPanel.mode === "link"
                        ? null
                        : { campaignId: c.campaignId, mode: "link" }
                    )
                  }
                >
                  Link to Store
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setOpenPanel(
                      openPanel?.campaignId === c.campaignId && openPanel.mode === "create"
                        ? null
                        : { campaignId: c.campaignId, mode: "create" }
                    )
                  }
                >
                  Create New Store
                </Button>
              </div>
            )}
          </div>

          {openPanel?.campaignId === c.campaignId && openPanel.mode === "link" && (
            <LinkForm
              campaign={c}
              stores={stores}
              onDone={() => {
                setOpenPanel(null);
                loadCampaigns();
                router.refresh();
              }}
            />
          )}

          {openPanel?.campaignId === c.campaignId && openPanel.mode === "create" && (
            <CreateForm
              campaign={c}
              categories={categories}
              onDone={() => {
                setOpenPanel(null);
                loadCampaigns();
                router.refresh();
              }}
            />
          )}
        </Card>
      ))}
    </div>
  );
}

function LinkForm({
  campaign,
  stores,
  onDone,
}: {
  campaign: Campaign;
  stores: StoreOption[];
  onDone: () => void;
}) {
  const [storeId, setStoreId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggested = campaign.domain
    ? stores.find((s) =>
        s.merchantDomains.some(
          (d) => d.toLowerCase() === campaign.domain!.toLowerCase() || campaign.domain!.toLowerCase().endsWith("." + d.toLowerCase())
        )
      )
    : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/campaigns/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "link", cuelinksCampaignId: campaign.campaignId, storeId }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Failed to link campaign");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Store
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          required
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
        >
          <option value="">Select a store...</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {suggested?.id === s.id ? "(suggested match)" : ""}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="primary" size="sm" disabled={loading || !storeId}>
        {loading ? "Linking..." : "Confirm Link"}
      </Button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

function CreateForm({
  campaign,
  categories,
  onDone,
}: {
  campaign: Campaign;
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [name, setName] = useState(campaign.name);
  const [slug, setSlug] = useState(slugify(campaign.name));
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [logoUrl, setLogoUrl] = useState(
    campaign.imageUrl ?? (campaign.domain ? publicLogoUrl(campaign.domain) : "")
  );
  const [cashbackRate, setCashbackRate] = useState(campaign.payout ? Number(campaign.payout) : 5);
  const [cashbackDisplayText, setCashbackDisplayText] = useState(
    campaign.payout ? `Up to ${campaign.payout}% Cashback` : "Up to 5% Cashback"
  );
  const [domains, setDomains] = useState(campaign.domain ?? "");
  const [rule, setRule] = useState<CashbackRuleValue>(DEFAULT_RULE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/campaigns/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        cuelinksCampaignId: campaign.campaignId,
        name,
        slug,
        categoryId,
        logoUrl,
        cashbackRate,
        cashbackDisplayText,
        domains: domains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        rule,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Failed to create store");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Store name
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Slug
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Logo URL{" "}
          <span className="text-slate-400">
            {campaign.imageUrl ? "(from Cuelinks)" : "(auto-fetched, override if needed)"}
          </span>
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Cashback rate (%)
          <Input
            type="number"
            value={cashbackRate}
            onChange={(e) => setCashbackRate(Number(e.target.value))}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Cashback display text
          <Input value={cashbackDisplayText} onChange={(e) => setCashbackDisplayText(e.target.value)} required />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs text-slate-600">
          Merchant domains (comma-separated)
          <Input value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="example.com, www.example.com" />
        </label>
      </div>

      <CashbackRuleEditor value={rule} onChange={setRule} />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="primary" disabled={loading} className="self-start">
        {loading ? "Creating..." : "Create Store (inactive)"}
      </Button>
    </form>
  );
}
