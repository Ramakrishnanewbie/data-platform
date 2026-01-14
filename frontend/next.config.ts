import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  experimental: {
    staleTimes: {
      dynamic: 1000 * 60 * 10,
      static: 1000 * 60 * 60, 
    },
    useCache: true,
  },
};

export default nextConfig;
