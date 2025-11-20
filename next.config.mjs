/** @type {import('next').NextConfig} */
if (!process.env.NEXT_DISABLE_AUTO_MOD_IMPORTS) {
  process.env.NEXT_DISABLE_AUTO_MOD_IMPORTS = '1';
}

const nextConfig = {
  generateBuildId: async () => {
    return process.env.NEXT_BUILD_ID ?? `sparecarry-${Date.now().toString(36)}`;
  },
  output: 'export',
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from trying to resolve Capacitor modules at build time
  webpack: (config, { isServer }) => {
    // Exclude Capacitor and Sentry modules from server-side bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@capacitor/core': 'commonjs @capacitor/core',
        '@capacitor/preferences': 'commonjs @capacitor/preferences',
        '@capacitor/push-notifications': 'commonjs @capacitor/push-notifications',
        '@capacitor/local-notifications': 'commonjs @capacitor/local-notifications',
        '@capacitor/haptics': 'commonjs @capacitor/haptics',
        '@capacitor/app': 'commonjs @capacitor/app',
      });
    }
    
    // For client-side, mark Capacitor and Sentry as external to prevent build-time resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@capacitor/preferences': false,
        '@capacitor/push-notifications': false,
        '@capacitor/local-notifications': false,
        '@capacitor/haptics': false,
        '@capacitor/app': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;

