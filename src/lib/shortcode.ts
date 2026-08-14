import { randomBytes } from "node:crypto";

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 8-char base62 code, e.g. for ProfitLink.code. Not cryptographically sensitive — just a short, unguessable-enough share code. */
export function generateShortCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += BASE62[bytes[i] % BASE62.length];
  }
  return code;
}
