import type { CampaignPage, CuelinksClient, ListCampaignsParams } from "./client.interface";
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
  async listCampaigns(params: ListCampaignsParams = {}): Promise<CampaignPage> {
    const perPage = Math.max(1, params.perPage ?? 60);
    const page = Math.max(1, params.page ?? 1);

    const matching = params.q
      ? STUB_CAMPAIGNS.filter((c) =>
          c.name.toLowerCase().includes(params.q!.toLowerCase())
        )
      : STUB_CAMPAIGNS;

    return {
      campaigns: matching.slice((page - 1) * perPage, page * perPage),
      page,
      perPage,
      total: matching.length,
      totalPages: Math.max(1, Math.ceil(matching.length / perPage)),
    };
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
