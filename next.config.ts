import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import { localNetworkHosts } from "./src/lib/network/check-in-origin";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return process.env.NEXT_PUBLIC_SUPABASE_SAME_ORIGIN === "true"
      ? [{ source: "/supabase/:path*", destination: "http://kong:8000/:path*" }]
      : [];
  },
  allowedDevOrigins: process.env.NODE_ENV === "development"
    ? localNetworkHosts(networkInterfaces())
    : [],
};

export default nextConfig;
