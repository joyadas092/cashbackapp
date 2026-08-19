/** @type {import('next').NextConfig} */
const nextConfig = {
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
