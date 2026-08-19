import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  referralCode: z.string().trim().toUpperCase().min(1).max(20).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const storeQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type StoreQueryInput = z.infer<typeof storeQuerySchema>;

export const createProfitLinkSchema = z.object({
  url: z.string().url().max(2048),
});
export type CreateProfitLinkInput = z.infer<typeof createProfitLinkSchema>;

export const cashbackRuleSchema = z
  .object({
    customerPct: z.number().min(0).max(100),
    profitLinkPct: z.number().min(0).max(100),
    referralPct: z.number().min(0).max(100),
    platformPct: z.number().min(0).max(100),
    fixedAmount: z.number().min(0).nullable().optional(),
    maxCashback: z.number().min(0).nullable().optional(),
    minOrderValue: z.number().min(0).nullable().optional(),
    validityDays: z.number().int().min(0).nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((r) => r.customerPct + r.profitLinkPct + r.referralPct + r.platformPct <= 100, {
    message: "customerPct + profitLinkPct + referralPct + platformPct cannot exceed 100",
  });
export type CashbackRuleInput = z.infer<typeof cashbackRuleSchema>;

export const storeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type StoreStatusInput = z.infer<typeof storeStatusSchema>;

export const adminCampaignImportSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("link"),
    cuelinksCampaignId: z.string().min(1),
    storeId: z.string().min(1),
  }),
  z.object({
    action: z.literal("create"),
    cuelinksCampaignId: z.string().min(1),
    name: z.string().min(2).max(100),
    slug: z
      .string()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    categoryId: z.string().min(1),
    logoUrl: z.string().url(),
    cashbackRate: z.number().min(0).max(100),
    cashbackDisplayText: z.string().min(1).max(200),
    domains: z.array(z.string()).default([]),
    rule: cashbackRuleSchema,
  }),
]);
export type AdminCampaignImportInput = z.infer<typeof adminCampaignImportSchema>;

export const createTicketSchema = z.object({
  subject: z.string().trim().min(5, "Give your ticket a short subject").max(150),
  category: z.string().trim().min(1).max(60),
  message: z.string().trim().min(10, "Tell us a bit more so we can help").max(5000),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const ticketReplySchema = z.object({
  body: z.string().trim().min(1, "Write a reply first").max(5000),
});
export type TicketReplyInput = z.infer<typeof ticketReplySchema>;

export const helpArticleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
  excerpt: z.string().trim().max(300).nullable().optional(),
  body: z.string().trim().min(10).max(20000),
  category: z.string().trim().min(1).max(60),
  isFaq: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type HelpArticleInput = z.infer<typeof helpArticleSchema>;

export const supportSettingsSchema = z.object({
  email: z.string().trim().email().max(150).nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(40).nullable().optional(),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  hours: z.string().trim().max(120).nullable().optional(),
  liveChatEnabled: z.boolean().default(false),
  liveChatNote: z.string().trim().max(150).nullable().optional(),
  responseNote: z.string().trim().max(150).nullable().optional(),
});
export type SupportSettingsInput = z.infer<typeof supportSettingsSchema>;

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  // Indian mobile numbers, optional. Stored as digits only so the unique
  // constraint can't be sidestepped by formatting the same number differently.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number")
    .transform((v) => (v === "" ? null : v.replace(/^\+91/, "")))
    .nullable()
    .optional(),
});
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    // Matches registerSchema: bcrypt silently truncates past 72 bytes, so
    // allowing longer would mean accepting a password we don't fully check.
    newPassword: z.string().min(8, "Use at least 8 characters").max(72),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Your new password must be different from your current one",
    path: ["newPassword"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const profileUpdateSchema = z.object({
  upiId: z.string().max(100).nullable().optional(),
  bankDetails: z
    .object({
      accountHolder: z.string().max(100).optional(),
      accountNumber: z.string().max(30).optional(),
      ifsc: z.string().max(20).optional(),
    })
    .nullable()
    .optional(),
  notificationPrefs: z.record(z.boolean()).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
