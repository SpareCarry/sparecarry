const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro treats the mobile app folder as the project root
config.projectRoot = __dirname;

// Allow Metro to watch the monorepo root so it can resolve pnpm hoisted deps
config.watchFolders = Array.from(
  new Set([...(config.watchFolders || []), path.resolve(__dirname, '../..')]),
);

// Workspace-aware resolver settings for pnpm + Expo Router
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  unstable_enableSymlinks: true,
  // Ensure standard source extensions are always enabled
  sourceExts: Array.from(
    new Set([...(config.resolver?.sourceExts ?? []), 'js', 'jsx', 'ts', 'tsx']),
  ),
  // Allow resolving from app node_modules and workspace root
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../..', 'node_modules'),
  ],
};

module.exports = config;