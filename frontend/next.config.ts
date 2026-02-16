import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
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
  typescript:{
     ignoreBuildErrors: true,
  }
};

export default nextConfig;
