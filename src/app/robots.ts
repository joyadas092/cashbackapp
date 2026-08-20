import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";
import { getSettings } from "@/lib/settings";

// Read the origin and the indexing switch at request time. Prerendering would
// freeze whatever the build container saw into the Sitemap line, and would make
// the admin's indexing toggle take a redeploy to apply.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  const settings = await getSettings();

  // Turning indexing off is a real switch: staging environments and
  // pre-launch sites need to be genuinely uncrawlable, not just missing a
  // sitemap.
  if (!settings.searchIndexingEnabled) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /go and /p are affiliate redirects — crawling them would burn clicks
        // and record bot traffic as real attribution. The rest is private or
        // machine-only.
        disallow: ["/admin", "/dashboard", "/api", "/go/", "/p/", "/ref/", "/refer/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
