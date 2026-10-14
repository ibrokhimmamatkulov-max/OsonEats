import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "osoneats.com" },
      { protocol: "https", hostname: "console.osoneats.com" },
      // placeholder dish photos until venues upload their own
      { protocol: "https", hostname: "www.themealdb.com" },
    ],
  },
};

export default nextConfig;
