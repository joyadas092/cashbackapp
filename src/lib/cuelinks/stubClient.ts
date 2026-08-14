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
// Fake campaigns so the admin campaign browser has something to render
// without a live CUELINKS_API_KEY. Not linked to real merchants.
const STUB_CAMPAIGNS: CuelinksCampaign[] = [
  {
    campaignId: "stub_campaign_1001",
    name: "Sample Fashion Co.",
    status: "active",
    imageUrl: "/logos/myntra.svg",
    domain: "samplefashion.example",
    payoutType: "Per Sale",
    payout: "6.5",
  },
  {
    campaignId: "stub_campaign_1002",
    name: "Sample Electronics Hub",
    status: "active",
    imageUrl: "/logos/flipkart.svg",
    domain: "sampleelectronics.example",
    payoutType: "Per Sale",
    payout: "4.0",
  },
  {
    campaignId: "stub_campaign_1003",
    name: "Sample Travel Deals",
    status: "active",
    domain: "sampletravel.example",
    payoutType: "Per Sale",
    payout: "3.0",
  },
];

export const stubClient: CuelinksClient = {
  async listCampaigns(): Promise<CuelinksCampaign[]> {
    return STUB_CAMPAIGNS;
  },

  async getCampaign(campaignId: string): Promise<CuelinksCampaign | null> {
    const stubCampaign = STUB_CAMPAIGNS.find((c) => c.campaignId === campaignId);
    if (stubCampaign) return stubCampaign;
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
