import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // book files (EPUB/PDF) uploaded through the add-book form can be large
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
