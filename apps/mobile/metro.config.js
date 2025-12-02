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
  const mobileReactPath = path.resolve(projectRoot, "node_modules", "react");
  const mobileReactDomPath = path.resolve(projectRoot, "node_modules", "react-dom");
  const mobileReactNativePath = path.resolve(projectRoot, "node_modules", "react-native");
  
  config.resolver = {
    ...config.resolver,
    nodeModulesPaths: [
      // Prefer mobile app's node_modules where React 19.1.0 is actually installed
      path.resolve(projectRoot, "node_modules"),
      // Root node_modules as fallback
      rootNodeModules,
    ],
    // Force React, React-DOM, and React-Native to resolve from mobile app's node_modules
    // This prevents multiple React instances in monorepo
    extraNodeModules: {
      // Point to mobile app's node_modules where React 19.1.0 is installed
      react: mobileReactPath,
      "react-dom": mobileReactDomPath,
      "react-native": mobileReactNativePath,
      // Ensure JSX runtime also resolves from the same React instance
      "react/jsx-runtime": path.resolve(mobileReactPath, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(mobileReactPath, "jsx-dev-runtime.js"),
    },
    // Intercept ALL React resolution requests to force single instance
    resolveRequest: (context, moduleName, platform) => {
      // Force all React imports to use the mobile app's React instance
      if (moduleName === "react" || moduleName.startsWith("react/")) {
        if (moduleName === "react") {
          return {
            filePath: path.resolve(mobileReactPath, "index.js"),
            type: "sourceFile",
          };
        } else if (moduleName === "react/jsx-runtime") {
          return {
            filePath: path.resolve(mobileReactPath, "jsx-runtime.js"),
            type: "sourceFile",
          };
        } else if (moduleName === "react/jsx-dev-runtime") {
          return {
            filePath: path.resolve(mobileReactPath, "jsx-dev-runtime.js"),
            type: "sourceFile",
          };
        }
      }
      // Use default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
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
