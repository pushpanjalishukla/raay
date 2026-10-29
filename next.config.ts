import type { NextConfig } from "next";

/** Clerk's Frontend API host is encoded in the publishable key (pk_test_<base64 "host$">). */
function clerkHost(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;
  try {
    const host = Buffer.from(key.split("_")[2] ?? "", "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
  } catch {
    return null;
  }
}

const isDev = process.env.NODE_ENV !== "production";
const clerk = clerkHost();
const clerkSources = [clerk, "https://*.clerk.accounts.dev"].filter(Boolean).join(" ");

// Allow-list of where the browser may load code, frames and data from.
// Next.js needs 'unsafe-inline' for its hydration scripts; React escaping is the main XSS defence.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${clerkSources} https://challenges.cloudflare.com https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://play-lh.googleusercontent.com https://*.mzstatic.com https://img.clerk.com https://cdn.razorpay.com",
  "font-src 'self' data:",
  `connect-src 'self' ${clerkSources} https://clerk-telemetry.com https://api.razorpay.com https://lumberjack.razorpay.com`,
  "frame-src https://challenges.cloudflare.com https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com")',
  },
  // Razorpay checkout and Clerk social sign-in use popups.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["google-play-scraper"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
      { protocol: "https", hostname: "*.mzstatic.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
