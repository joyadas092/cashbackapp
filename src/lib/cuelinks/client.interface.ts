import type {
  CuelinksCampaign,
  CuelinksTransaction,
  GetTransactionsParams,
  LinkConversionRequest,
  LinkConversionResult,
} from "./types";

/**
 * Contract every Cuelinks client implementation (stub or real) must satisfy.
 * Only `convertLink` is exercised in Phase 1; the rest exist now so Phase 2+
 * (campaign sync, transaction reconciliation) can be added without touching
 * call sites.
 */
export interface ListCampaignsParams {
  page?: number;
  perPage?: number;
  /** Free-text search. Cuelinks ignores country filtering when this is set. */
  q?: string;
}

export interface CampaignPage {
  campaigns: CuelinksCampaign[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CuelinksClient {
  /**
   * One page of campaigns. Paginated because the account carries hundreds —
   * fetching without a page size returned only Cuelinks' small default, which
   * is why the admin browser appeared to show a handful of campaigns.
   */
  listCampaigns(params?: ListCampaignsParams): Promise<CampaignPage>;
  getCampaign(campaignId: string): Promise<CuelinksCampaign | null>;
  convertLink(req: LinkConversionRequest): Promise<LinkConversionResult>;
  getTransactions(params: GetTransactionsParams): Promise<CuelinksTransaction[]>;
  getReports(params: GetTransactionsParams): Promise<CuelinksTransaction[]>;
}
