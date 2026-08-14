/**
 * SSRF- and open-redirect-safe validation for user-submitted "Share & Earn"
 * product/merchant URLs (spec section 35).
 *
 * This module NEVER calls fetch()/http on the submitted URL — that's the
 * entire SSRF mitigation. Parsing a string with `new URL()` is not a network
 * operation. What this validator provides:
 *   - SSRF protection: the app never makes a server-side request to a
 *     user-controlled URL, at all, anywhere.
 *   - Open-redirect protection: a ProfitLink is only ever created for a URL
 *     whose hostname matches an allowlisted, profit-link-eligible store's
 *     merchantDomains — never an arbitrary destination.
 *
 * Residual risk (not eliminated, inherent to affiliate redirects): a
 * validated link still ultimately sends the clicking user's browser through
 * Cuelinks to the merchant site. That's the intended behavior of an
 * affiliate redirect, not a vulnerability this validator is meant to close.
 */

const MAX_URL_LENGTH = 2048;

const IP_LITERAL_PATTERN =
  /^(\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-fA-F:]+\]?$/;

export interface EligibleStore {
  id: string;
  slug: string;
  name: string;
  merchantDomains: string[];
}

export interface MerchantMatch {
  store: { id: string; slug: string; name: string };
  hostname: string;
}

export type ValidateMerchantUrlResult =
  | { ok: true; match: MerchantMatch }
  | { ok: false; reason: string };

function hostnameMatches(hostname: string, domain: string): boolean {
  const h = hostname.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith("." + d);
}

export function validateMerchantUrl(
  rawUrl: string,
  eligibleStores: EligibleStore[]
): ValidateMerchantUrlResult {
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
    return { ok: false, reason: "URL is missing or too long." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Only https:// links are supported." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with embedded credentials are not supported." };
  }

  const hostname = parsed.hostname;

  if (!hostname || IP_LITERAL_PATTERN.test(hostname)) {
    return { ok: false, reason: "That doesn't look like a valid merchant domain." };
  }

  for (const store of eligibleStores) {
    for (const domain of store.merchantDomains) {
      if (hostnameMatches(hostname, domain)) {
        return {
          ok: true,
          match: { store: { id: store.id, slug: store.slug, name: store.name }, hostname },
        };
      }
    }
  }

  return {
    ok: false,
    reason: "This link isn't from a store we currently support for Share & Earn.",
  };
}
