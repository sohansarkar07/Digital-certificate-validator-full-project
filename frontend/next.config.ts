import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  transpilePackages: ["@splinetool/react-spline", "@splinetool/runtime"],
};

export default nextConfig;
