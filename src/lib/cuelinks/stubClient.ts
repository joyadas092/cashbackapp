import type { CuelinksClient } from "./client.interface";
import type {
  CuelinksCampaign,
  CuelinksTransaction,
  GetTransactionsParams,
  LinkConversionRequest,
  LinkConversionResult,
} from "./types";

/**
 * Deterministic fake Cuelinks client. No network calls. Lets the whole
 * click/redirect flow be demoed and tested without live Cuelinks credentials.
 */
export const stubClient: CuelinksClient = {
  async listCampaigns(): Promise<CuelinksCampaign[]> {
    return [];
  },

  async getCampaign(campaignId: string): Promise<CuelinksCampaign | null> {
    return {
      campaignId,
      name: campaignId.replace(/^stub_/, ""),
      status: "active",
      commissionType: "percentage",
      commissionValue: 5,
    };
  },

  async convertLink(req: LinkConversionRequest): Promise<LinkConversionResult> {
    const params = new URLSearchParams();
    params.set("url", req.destinationUrl);
    if (req.campaignId) params.set("campaign", req.campaignId);
    for (const key of ["subid", "subid2", "subid3", "subid4", "subid5"] as const) {
      const value = req[key];
      if (value) params.set(key, value);
    }
    return {
      trackingUrl: `https://stub.cuelinks.local/track?${params.toString()}`,
      campaignId: req.campaignId,
    };
  },

  async getTransactions(_params: GetTransactionsParams): Promise<CuelinksTransaction[]> {
    return [];
  },

  async getReports(_params: GetTransactionsParams): Promise<CuelinksTransaction[]> {
    return [];
  },
};
