import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "export", // Static export for Capacitor
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
