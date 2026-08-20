/** @type {import('next').NextConfig} */
const nextConfig = {
  // A dev server holds a lock on .next on Windows, so a verification build can
  // be pointed elsewhere with NEXT_DIST_DIR instead of stopping it. Unset in
  // CI and on Railway, where the default applies.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      // Share & Earn moved to a public, indexable URL. This has to live here
      // rather than in the old page: /dashboard/** is auth-guarded, so a
      // page-level redirect never runs for a logged-out visitor (or a crawler)
      // following an old link — they get bounced to /login instead.
      {
        source: "/dashboard/share-earn",
        destination: "/share-earn",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
