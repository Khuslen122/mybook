import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // book files (EPUB/PDF) uploaded through the add-book form can be large
      bodySizeLimit: "30mb",
    },
  },
  images: {
    // uploaded covers are served from Vercel Blob, on a per-store subdomain
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
