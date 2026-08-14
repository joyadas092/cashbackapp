import type { CuelinksClient } from "./client.interface";
import { stubClient } from "./stubClient";
import { realClient } from "./realClient";

let warned = false;

/**
 * Returns the real Cuelinks client if CUELINKS_API_KEY is configured,
 * otherwise falls back to a deterministic stub (no network calls). This is
 * the only entry point call sites should use — never import realClient or
 * stubClient directly.
 */
export function getCuelinksClient(): CuelinksClient {
  if (!process.env.CUELINKS_API_KEY) {
    if (!warned) {
      console.warn("[cuelinks] CUELINKS_API_KEY not set — running in STUB mode");
      warned = true;
    }
    return stubClient;
  }

  return realClient;
}

export type { CuelinksClient } from "./client.interface";
export type {
  CuelinksCampaign,
  CuelinksTransaction,
  GetTransactionsParams,
  LinkConversionRequest,
  LinkConversionResult,
} from "./types";
