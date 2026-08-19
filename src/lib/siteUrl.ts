/**
 * The site's public origin, used for canonical URLs, Open Graph tags, sitemap
 * entries and robots.txt.
 *
 * Order matters: an explicit NEXT_PUBLIC_SITE_URL wins, then the auth origin
 * (which production already has to set correctly for NextAuth to work), then
 * Railway's injected public domain, and finally localhost for dev. Getting this
 * wrong doesn't break the app, but it does emit canonicals pointing at the wrong
 * host — which is worse than emitting none.
 */
export function siteUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined) ??
    "http://localhost:3000";

  return candidate.replace(/\/+$/, "");
}
