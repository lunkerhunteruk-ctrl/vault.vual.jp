import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-63bccf8e4ef949bb8384ab641631a180.r2.dev",
      },
    ],
  },
};

export default nextConfig;
