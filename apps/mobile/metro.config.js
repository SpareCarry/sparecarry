// apps/mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");
const rootNodeModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

// Make sure Metro watches the workspace packages and root folders needed by mobile
config.watchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "lib"), // Root lib folder for shared services
  path.resolve(workspaceRoot, "src"), // Root src folder (shipping depends on src/constants)
  path.resolve(workspaceRoot, "config"), // Root config folder
  path.resolve(workspaceRoot, "utils"), // Root utils folder
  path.resolve(workspaceRoot, "modules"), // Root modules folder (auto-measure, etc.)
  path.resolve(workspaceRoot, "assets"), // Root assets folder (courierRates, customs JSON, etc.)
];

// Ensure Metro resolves to app node_modules first (avoid duplicate react)
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    // Prefer the root node_modules where pnpm actually installs React/RN
    rootNodeModules,
    path.resolve(projectRoot, "node_modules"),
  ],
  // Force React, React-DOM, and React-Native to resolve from mobile app's node_modules
  // This prevents multiple React instances in monorepo
  extraNodeModules: {
    // Explicitly map React packages to the single root node_modules
    // With pnpm, this is where the real packages live (symlinked into apps)
    react: path.join(rootNodeModules, "react"),
    "react-dom": path.join(rootNodeModules, "react-dom"),
    "react-native": path.join(rootNodeModules, "react-native"),
    // Ensure JSX runtime also resolves from the same React instance
    "react/jsx-runtime": path.join(
      rootNodeModules,
      "node_modules",
      "react",
      "jsx-runtime.js"
    ),
    "react/jsx-dev-runtime": path.join(
      rootNodeModules,
      "node_modules",
      "react",
      "jsx-dev-runtime.js"
    ),
  },
  // Metro aliases for root-level folders (allows importing from root-level code)
  alias: {
    "@root-lib": path.resolve(workspaceRoot, "lib"),
    "@root-src": path.resolve(workspaceRoot, "src"),
    "@root-config": path.resolve(workspaceRoot, "config"),
    "@root-utils": path.resolve(workspaceRoot, "utils"),
  },
  // include cjs extension (helps with some hoisted libs)
  sourceExts: [...config.resolver.sourceExts, "cjs", "ts", "tsx"],
};

// Keep transform options
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
