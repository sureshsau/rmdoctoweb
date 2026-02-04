import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rmdocto-medicines.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      }
    ],
  },
};

export default nextConfig;
