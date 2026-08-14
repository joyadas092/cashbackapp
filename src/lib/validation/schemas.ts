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
