import type { CuelinksClient } from "./client.interface";
import type {
  CuelinksCampaign,
  CuelinksTransaction,
  GetTransactionsParams,
  LinkConversionRequest,
  LinkConversionResult,
} from "./types";

/**
 * Cuelinks Publisher API v3 client skeleton.
 *
 * NOT independently verified against live Cuelinks docs during this build
 * (no network/docs access at scaffold time). Before first real use:
 *   - Confirm exact base URL / endpoint paths at developers.cuelinks.com
 *   - Confirm auth header format for a v3 scoped key (Bearer vs custom header)
 *   - Confirm exact request/response field names for link conversion,
 *     campaign listing, and transactions/reports endpoints
 *   - Confirm subid1-5 parameter names in the link-conversion payload
 *
 * Do not treat this file as a verified integration until each TODO below
 * has been checked against the current Cuelinks API v3 documentation.
 */

const BASE_URL = "https://www.cuelinks.com/api/v3"; // TODO: verify exact base URL

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
      // TODO: verify header name/scheme for v3 scoped keys (Authorization: Bearer <key>?)
      Authorization: `Bearer ${getApiKey()}`,
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

export const realClient: CuelinksClient = {
  async listCampaigns(): Promise<CuelinksCampaign[]> {
    // TODO: verify endpoint path and response shape
    return cuelinksFetch<CuelinksCampaign[]>("/campaigns");
  },

  async getCampaign(campaignId: string): Promise<CuelinksCampaign | null> {
    // TODO: verify endpoint path
    return cuelinksFetch<CuelinksCampaign | null>(`/campaigns/${campaignId}`);
  },

  async convertLink(req: LinkConversionRequest): Promise<LinkConversionResult> {
    // TODO: verify endpoint path and exact request body field names
    return cuelinksFetch<LinkConversionResult>("/links/convert", {
      method: "POST",
      body: JSON.stringify({
        url: req.destinationUrl,
        campaign_id: req.campaignId,
        subid: req.subid,
        subid2: req.subid2,
        subid3: req.subid3,
        subid4: req.subid4,
        subid5: req.subid5,
      }),
    });
  },

  async getTransactions(params: GetTransactionsParams): Promise<CuelinksTransaction[]> {
    // TODO: verify endpoint path and query param names
    const qs = new URLSearchParams();
    if (params.fromDate) qs.set("from_date", params.fromDate);
    if (params.toDate) qs.set("to_date", params.toDate);
    if (params.page) qs.set("page", String(params.page));
    return cuelinksFetch<CuelinksTransaction[]>(`/transactions?${qs.toString()}`);
  },

  async getReports(params: GetTransactionsParams): Promise<CuelinksTransaction[]> {
    // TODO: verify endpoint path and query param names
    const qs = new URLSearchParams();
    if (params.fromDate) qs.set("from_date", params.fromDate);
    if (params.toDate) qs.set("to_date", params.toDate);
    if (params.page) qs.set("page", String(params.page));
    return cuelinksFetch<CuelinksTransaction[]>(`/reports?${qs.toString()}`);
  },
};
