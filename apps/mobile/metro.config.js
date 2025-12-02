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

  // React is hoisted to root node_modules in pnpm monorepo
  // Point Metro to use root node_modules for React
  const rootReactPath = path.resolve(rootNodeModules, "react");
  const rootReactDomPath = path.resolve(rootNodeModules, "react-dom");
  
  config.resolver = {
    ...config.resolver,
    nodeModulesPaths: [
      // Check mobile app's node_modules first
      path.resolve(projectRoot, "node_modules"),
      // Then root node_modules (where React is hoisted)
      rootNodeModules,
    ],
    // Point to root node_modules where React is actually installed
    extraNodeModules: {
      react: rootReactPath,
      "react-dom": rootReactDomPath,
      "react/jsx-runtime": path.resolve(rootReactPath, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(rootReactPath, "jsx-dev-runtime.js"),
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
  },

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
