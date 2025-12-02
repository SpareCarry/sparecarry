// apps/mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Make sure Metro watches the workspace packages and root folders needed by mobile
config.watchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "lib"), // Root lib folder for shared services
  path.resolve(workspaceRoot, "src"), // Root src folder (shipping depends on src/constants)
  path.resolve(workspaceRoot, "config"), // Root config folder
  path.resolve(workspaceRoot, "utils"), // Root utils folder
  path.resolve(workspaceRoot, "modules"), // Root modules folder (auto-measure, etc.)
  path.resolve(workspaceRoot, "assets"), // Root assets folder (courierRates, customs JSON, etc.)
];

// Always resolve React from the local app's node_modules to avoid duplicate React copies
const localReactPath = path.resolve(projectRoot, "node_modules", "react");
const localReactDomPath = path.resolve(projectRoot, "node_modules", "react-dom");

config.resolver = {
  ...config.resolver,
  // Only use the app's node_modules when resolving packages to prevent pulling React from pnpm workspace
  nodeModulesPaths: [path.resolve(projectRoot, "node_modules")],
  // Force all React-related imports to use the local React installation
  extraNodeModules: {
    react: localReactPath,
    "react-dom": localReactDomPath,
    "react/jsx-runtime": path.resolve(localReactPath, "jsx-runtime.js"),
    "react/jsx-dev-runtime": path.resolve(
      localReactPath,
      "jsx-dev-runtime.js"
    ),
  },
  // Metro aliases for root-level folders (allows importing from root-level code)
  alias: {
    "@root-lib": path.resolve(workspaceRoot, "lib"),
    "@root-src": path.resolve(workspaceRoot, "src"),
    "@root-config": path.resolve(workspaceRoot, "config"),
    "@root-utils": path.resolve(workspaceRoot, "utils"),
    // Allow shared hooks to import the mobile Google Sign-In helper via package name
    "@sparecarry/mobile/lib/auth/googleSignIn": path.resolve(
      projectRoot,
      "lib/auth/googleSignIn"
    ),
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
