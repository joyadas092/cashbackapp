import type { CampaignPage, CuelinksClient, ListCampaignsParams } from "./client.interface";
import type {
  CuelinksCampaign,
  CuelinksTransaction,
  GetTransactionsParams,
  LinkConversionRequest,
  LinkConversionResult,
} from "./types";

/**
 * Cuelinks Publisher API v3 client.
 *
 * Verified 2026-08-14 against developers.cuelinks.com (base URL, auth header
 * format, and the /links/convert, /campaigns, /transactions request and
 * response shapes were fetched directly from the live docs, not guessed).
 * Not independently tested against a live account — treat as verified
 * *shape*, not a confirmed-working integration, until exercised for real.
 */

const BASE_URL = "https://developers.cuelinks.com/pub_api/v3";

function getApiKey(): string {
  const key = process.env.CUELINKS_API_KEY;
  if (!key) {
    throw new Error(
      "CUELINKS_API_KEY is not set. realClient should not be constructed without it — use getCuelinksClient() from lib/cuelinks/index.ts, which falls back to stubClient automatically."
    );
  }
  return key;
}

async function cuelinksFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cuelinks API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

interface ConvertLinkResponse {
  data: {
    tracking_url: string;
    short_url?: string;
    affiliated: boolean;
    original_url: string;
    campaign: { id: number; name: string } | null;
  };
}

interface CampaignsListResponse {
  data: Array<{
    id: number;
    name: string;
    domain: string;
    image?: string | null;
    access_status: string;
    campaign_type: string;
    payout_type?: string;
    payout: string;
  }>;
  /** Present on list endpoints; absent on the search-by-id path. */
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface TransactionsListResponse {
  data: Array<{
    id: number;
    campaign_id: number;
    order_id: string | null;
    merchant_reference_id: string | null;
    sale_amount: string | null;
    user_commission: string | null;
    currency: string;
    status: string;
    sub_id: string | null;
    transaction_date: string;
  }>;
}

export const realClient: CuelinksClient = {
  async listCampaigns(params: ListCampaignsParams = {}): Promise<CampaignPage> {
    const page = Math.max(1, params.page ?? 1);
    // 100 is Cuelinks' documented maximum per page (500 for search); asking for
    // a page size at all is the fix — the default returns a couple of dozen.
    const perPage = Math.min(100, Math.max(1, params.perPage ?? 60));

    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (params.q) query.set("q", params.q);

    const res = await cuelinksFetch<CampaignsListResponse>(`/campaigns?${query.toString()}`);

    return {
      campaigns: res.data.map((c) => ({
        campaignId: String(c.id),
        name: c.name,
        status: c.access_status === "approved" ? "active" : "inactive",
        imageUrl: c.image ?? undefined,
        domain: c.domain,
        payoutType: c.payout_type,
        payout: c.payout,
      })),
      page: res.meta?.page ?? page,
      perPage: res.meta?.per_page ?? perPage,
      total: res.meta?.total ?? res.data.length,
      totalPages: res.meta?.total_pages ?? 1,
    };
  },

  async getCampaign(campaignId: string): Promise<CuelinksCampaign | null> {
    const res = await cuelinksFetch<CampaignsListResponse>(`/campaigns?q=${encodeURIComponent(campaignId)}`);
    const match = res.data.find((c) => String(c.id) === campaignId);
    if (!match) return null;
    return {
      campaignId: String(match.id),
      name: match.name,
      status: match.access_status === "approved" ? "active" : "inactive",
      imageUrl: match.image ?? undefined,
      domain: match.domain,
      payoutType: match.payout_type,
      payout: match.payout,
    };
  },

  async convertLink(req: LinkConversionRequest): Promise<LinkConversionResult> {
    const res = await cuelinksFetch<ConvertLinkResponse>("/links/convert", {
      method: "POST",
      body: JSON.stringify({
        url: req.destinationUrl,
        channel_id: process.env.CUELINKS_CHANNEL_ID || undefined,
        subid: req.subid,
        subid2: req.subid2,
        subid3: req.subid3,
        subid4: req.subid4,
        subid5: req.subid5,
      }),
    });

    return {
      trackingUrl: res.data.tracking_url,
      campaignId: res.data.campaign ? String(res.data.campaign.id) : req.campaignId,
      merchantName: res.data.campaign?.name,
    };
  },

  async getTransactions(params: GetTransactionsParams): Promise<CuelinksTransaction[]> {
    const qs = new URLSearchParams();
    if (params.fromDate) qs.set("start_date", params.fromDate);
    if (params.toDate) qs.set("end_date", params.toDate);
    if (params.page) qs.set("page", String(params.page));
    const res = await cuelinksFetch<TransactionsListResponse>(`/transactions?${qs.toString()}`);
    return res.data.map((t) => ({
      cuelinksTransactionId: String(t.id),
      campaignId: String(t.campaign_id),
      orderId: t.order_id ?? t.merchant_reference_id ?? undefined,
      saleAmount: t.sale_amount ? Number(t.sale_amount) : 0,
      commission: t.user_commission ? Number(t.user_commission) : 0,
      currency: t.currency,
      status: t.status,
      subid: t.sub_id ?? undefined,
      transactionDate: t.transaction_date,
    }));
  },

  async getReports(params: GetTransactionsParams): Promise<CuelinksTransaction[]> {
    // Cuelinks v3 splits this into /reports/performance and /reports/campaigns,
    // neither of which maps cleanly onto our per-transaction CuelinksTransaction
    // shape (they're aggregate reports, not transaction lists). Falling back
    // to /transactions here, which is what Phase 4's reconciliation job
    // actually needs (backfill/reconcile individual transactions) — revisit
    // if aggregate reporting is needed later.
    return this.getTransactions(params);
  },
};
