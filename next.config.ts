import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["google-play-scraper"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
      { protocol: "https", hostname: "*.mzstatic.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
