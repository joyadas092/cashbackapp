import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

// Read the origin at request time. Prerendering would freeze whatever URL the
// build container happened to see into the Sitemap line.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

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
