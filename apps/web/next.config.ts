import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, we'll use the BACKEND_URL environment variable.
    // In local development, it defaults to http://localhost:8000
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    return [
      {
        source: "/api/agent/:path*",
        destination: `${backendUrl}/api/agent/:path*`,
      },
    ];
  },
};

export default nextConfig;
