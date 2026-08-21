/**
 * Where a publisher stands on a campaign.
 *
 * `open` needs no application — it can be promoted immediately, same as
 * `approved`. Everything else means no commission will be paid.
 */
export type CampaignAccessStatus =
  | "open"
  | "approved"
  | "pending"
  | "not_applied"
  | "rejected"
  | "restricted";

export interface CuelinksCampaign {
  campaignId: string;
  name: string;
  status: "active" | "inactive";
  commissionType?: "percentage" | "fixed";
  commissionValue?: number;
  /** Cuelinks-hosted campaign/merchant logo, when available. */
  imageUrl?: string;
  domain?: string;
  payoutType?: string;
  payout?: string;

  // --- Eligibility -----------------------------------------------------------
  // These decide whether a store can pay cashback at all. Without them the app
  // cannot tell an earning campaign from one that will silently never pay.
  accessStatus?: CampaignAccessStatus;
  /**
   * Whether sub ids round-trip. Fatal when false: attribution is keyed on
   * subid=c_<clickId>, so a postback could never be matched back to a click.
   */
  subIdsAllowed?: boolean;
  /** Whether the advertiser permits cashback publishers on this campaign. */
  cashbackPublishersAllowed?: boolean;
  /** Whether a missing-transaction query can be raised with the network. */
  missingTransactionsAccepted?: boolean;
  cookieDuration?: string;
  /** "Realtime" or "Offline" — how quickly transactions appear. */
  reportingType?: string;
  /** Earnings per click over 90 days, for judging whether a store is worth carrying. */
  epc90d?: number;
}

export interface LinkConversionRequest {
  destinationUrl: string;
  campaignId?: string;
  subid?: string;
  subid2?: string;
  subid3?: string;
  subid4?: string;
  subid5?: string;
}

export interface LinkConversionResult {
  trackingUrl: string;
  campaignId?: string;
  merchantName?: string;
}

export interface CuelinksTransaction {
  cuelinksTransactionId: string;
  campaignId: string;
  orderId?: string;
  saleAmount: number;
  commission: number;
  currency: string;
  status: string;
  subid?: string;
  subid2?: string;
  subid3?: string;
  subid4?: string;
  subid5?: string;
  transactionDate: string;
}

export interface GetTransactionsParams {
  fromDate?: string;
  toDate?: string;
  page?: number;
}
