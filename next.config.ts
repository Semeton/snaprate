import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ["localhost"], // Add your production image domains here
    formats: ["image/webp", "image/avif"],
  },

  // Experimental features (disable for production stability)
  experimental: {
    // Disable experimental features for production
  },
};

export default nextConfig;
