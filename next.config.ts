import type { NextConfig } from "next";

const extraDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  // Allow phone/LAN access to Next.js HMR and other /_next/* resources in dev.
  // Add more hosts via ALLOWED_DEV_ORIGINS (comma-separated) in .env.local.
  allowedDevOrigins: ["172.20.10.6", ...extraDevOrigins],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
