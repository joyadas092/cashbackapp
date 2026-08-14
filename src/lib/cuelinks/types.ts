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
