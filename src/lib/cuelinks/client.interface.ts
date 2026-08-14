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
export interface CuelinksClient {
  listCampaigns(): Promise<CuelinksCampaign[]>;
  getCampaign(campaignId: string): Promise<CuelinksCampaign | null>;
  convertLink(req: LinkConversionRequest): Promise<LinkConversionResult>;
  getTransactions(params: GetTransactionsParams): Promise<CuelinksTransaction[]>;
  getReports(params: GetTransactionsParams): Promise<CuelinksTransaction[]>;
}
