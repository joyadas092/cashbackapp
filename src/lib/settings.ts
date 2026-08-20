import { prisma } from "@/lib/db";

/**
 * Platform settings, stored one row per key in the Setting table.
 *
 * Every setting here is enforced somewhere. A toggle that changes nothing is
 * worse than no toggle at all — it tells an admin they have control they don't
 * have — so anything we can't actually honour is deliberately absent rather
 * than rendered and ignored.
 */
export interface PlatformSettings {
  // --- General -------------------------------------------------------------
  siteName: string;
  siteTagline: string;
  adminEmail: string;
  supportEmail: string;

  // --- Platform toggles ----------------------------------------------------
  /** Gates POST /api/auth/register and hides the sign-up entry points. */
  registrationEnabled: boolean;
  /** Middleware serves a holding page for public routes; admins still get in. */
  maintenanceMode: boolean;
  maintenanceMessage: string;
  /** Gates profit-link creation (Share & Earn). */
  affiliateEnabled: boolean;
  /** Gates referral capture at signup. */
  referralEnabled: boolean;

  // --- Payouts -------------------------------------------------------------
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  /** Methods offered to users and accepted by the withdrawal endpoint. */
  payoutMethods: string[];
  /**
   * Withdrawals above this amount require a PAN on file, for TDS. Zero means
   * never require one.
   */
  panRequiredAboveAmount: number;

  // --- SEO -----------------------------------------------------------------
  seoTitle: string;
  seoDescription: string;
  /** False emits a site-wide Disallow in robots.txt. */
  searchIndexingEnabled: boolean;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: "CashbackApp",
  siteTagline: "Shop Smarter. Get Cashback. Earn More.",
  adminEmail: "",
  supportEmail: "",

  registrationEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: "We're doing some maintenance and will be back shortly.",
  affiliateEnabled: true,
  referralEnabled: true,

  // Kept as its own row for backwards compatibility: the withdrawal endpoint
  // and wallet page already read `min_withdrawal_amount` directly.
  minWithdrawalAmount: 100,
  maxWithdrawalAmount: 50000,
  payoutMethods: ["UPI", "BANK_TRANSFER", "PAYTM", "AMAZON_PAY"],
  panRequiredAboveAmount: 10000,

  seoTitle: "CashbackApp — Shop Smarter. Get Cashback. Earn More.",
  seoDescription:
    "Shop your favourite stores, get real cashback, and earn extra by sharing deals.",
  searchIndexingEnabled: true,
};

/** Maps a settings field to its row key. */
export const SETTING_KEYS: Record<keyof PlatformSettings, string> = {
  siteName: "site_name",
  siteTagline: "site_tagline",
  adminEmail: "admin_email",
  supportEmail: "support_email",
  registrationEnabled: "registration_enabled",
  maintenanceMode: "maintenance_mode",
  maintenanceMessage: "maintenance_message",
  affiliateEnabled: "affiliate_enabled",
  referralEnabled: "referral_enabled",
  minWithdrawalAmount: "min_withdrawal_amount",
  maxWithdrawalAmount: "max_withdrawal_amount",
  payoutMethods: "payout_methods",
  panRequiredAboveAmount: "pan_required_above_amount",
  seoTitle: "seo_title",
  seoDescription: "seo_description",
  searchIndexingEnabled: "search_indexing_enabled",
};

function coerce<K extends keyof PlatformSettings>(
  key: K,
  raw: unknown
): PlatformSettings[K] {
  const fallback = DEFAULT_SETTINGS[key];

  if (raw === null || raw === undefined) return fallback;

  if (typeof fallback === "boolean") {
    return (typeof raw === "boolean" ? raw : raw === "true") as PlatformSettings[K];
  }
  if (typeof fallback === "number") {
    const value = Number(raw);
    return (Number.isFinite(value) ? value : fallback) as PlatformSettings[K];
  }
  if (Array.isArray(fallback)) {
    return (Array.isArray(raw) ? raw : fallback) as PlatformSettings[K];
  }
  return (typeof raw === "string" ? raw : fallback) as PlatformSettings[K];
}

/**
 * Read every setting in one query, filling gaps from the defaults.
 *
 * Not cached: these are read on request-time pages and change rarely, and a
 * stale cache on `maintenanceMode` would keep the site down (or up) after an
 * admin flipped it, which is exactly when you need it to be right.
 */
export async function getSettings(): Promise<PlatformSettings> {
  const rows = await prisma.setting.findMany().catch(() => []);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  const result = { ...DEFAULT_SETTINGS };
  for (const field of Object.keys(SETTING_KEYS) as Array<keyof PlatformSettings>) {
    const raw = byKey.get(SETTING_KEYS[field]);
    // @ts-expect-error — each field is coerced to its own type above.
    result[field] = coerce(field, raw);
  }
  return result;
}

/** Read a single setting without loading the rest. */
export async function getSetting<K extends keyof PlatformSettings>(
  key: K
): Promise<PlatformSettings[K]> {
  const row = await prisma.setting
    .findUnique({ where: { key: SETTING_KEYS[key] } })
    .catch(() => null);
  return coerce(key, row?.value);
}
