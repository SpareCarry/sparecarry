/** Auto-generated safe next.config.js (backup saved as next.config.js.bak) */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  turbo: false,
  webpack: (config, { isServer }) => {
    // keep default behavior; this prevents Turbopack from being forced
    return config;
  },
};
module.exports = nextConfig;
