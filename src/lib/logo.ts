/**
 * Best-effort public logo/favicon URL for a merchant domain. Google's
 * favicon service (redirects to a gstatic CDN) is used because it's free,
 * unauthenticated, and reliable — verified working 2026-08-14. Clearbit's
 * logo API (the more commonly cited option) is dead/unreachable as of this
 * date, so it is deliberately not used here.
 *
 * This always returns a URL (Google's service falls back to a generic globe
 * icon rather than 404ing when it has nothing better), so treat this as a
 * pre-fill default — the admin can always paste a better logo URL directly
 * over it (see the Store Logo field on /admin/stores).
 */
export function publicLogoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}
