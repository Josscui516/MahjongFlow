import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import { localQrHosts } from "./src/lib/network/check-in-origin";

const nextConfig: NextConfig = {
  output: "standalone",
  // Windows Docker bind mounts do not reliably forward filesystem events.
  ...(process.env.NODE_ENV === "development" && process.env.LOCAL_DOCKER_POLLING === "true"
    ? { watchOptions: { pollIntervalMs: 1000 } }
    : {}),
  async rewrites() {
    return process.env.NEXT_PUBLIC_SUPABASE_SAME_ORIGIN === "true"
      ? [{ source: "/supabase/:path*", destination: "http://kong:8000/:path*" }]
      : [];
  },
  allowedDevOrigins: process.env.NODE_ENV === "development"
    ? localQrHosts(process.env.LOCAL_DOCKER_HOST_IP, networkInterfaces(), process.env.NEXT_PUBLIC_SUPABASE_SAME_ORIGIN === "true")
    : [],
};

export default nextConfig;
