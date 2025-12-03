// apps/mobile/metro.config.js
// 
// Metro bundler configuration for SpareCarry mobile app in monorepo setup.
// This config merges Expo defaults with monorepo-specific customizations.
// See EXPO_DOCTOR_WARNINGS.md for explanation of expected warnings.
//
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Merge Expo's default watchFolders with our monorepo folders
// This satisfies expo-doctor while maintaining monorepo functionality
const defaultWatchFolders = config.watchFolders || [projectRoot];
const monorepoWatchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "lib"), // Root lib folder for shared services
  path.resolve(workspaceRoot, "src"), // Root src folder (shipping depends on src/constants)
  path.resolve(workspaceRoot, "config"), // Root config folder
  path.resolve(workspaceRoot, "utils"), // Root utils folder
  path.resolve(workspaceRoot, "modules"), // Root modules folder (auto-measure, etc.)
  path.resolve(workspaceRoot, "assets"), // Root assets folder (courierRates, customs JSON, etc.)
];
// Combine defaults with monorepo folders, removing duplicates
config.watchFolders = Array.from(
  new Set([...defaultWatchFolders, ...monorepoWatchFolders])
);

// Resolve React from workspace root (hoisted) to avoid duplicate React copies
// With pnpm hoisted node-linker, React is in workspace root, not local app node_modules
const workspaceReactPath = path.resolve(workspaceRoot, "node_modules", "react");
const workspaceReactDomPath = path.resolve(workspaceRoot, "node_modules", "react-dom");
const localReactPath = path.resolve(projectRoot, "node_modules", "react");
const localReactDomPath = path.resolve(projectRoot, "node_modules", "react-dom");

// Prefer workspace root React (hoisted), fallback to local if exists
const reactPath = fs.existsSync(workspaceReactPath) ? workspaceReactPath : localReactPath;
const reactDomPath = fs.existsSync(workspaceReactDomPath) ? workspaceReactDomPath : localReactDomPath;

// Verify React exists
if (!fs.existsSync(reactPath)) {
  console.warn(
    "⚠️ Warning: React not found. Checked:",
    workspaceReactPath,
    "and",
    localReactPath
  );
}

// Save original resolveRequest if it exists
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  // NOTE: Include both workspace root and app node_modules for proper resolution
  // Workspace root has hoisted React (via pnpm), app node_modules has Expo-specific packages
  // This ensures all packages use the same React instance from workspace root
  nodeModulesPaths: [
    path.resolve(workspaceRoot, "node_modules"), // Hoisted packages (React, etc.)
    path.resolve(projectRoot, "node_modules"), // App-specific packages
  ],
  // Force all React-related imports to use the hoisted React installation from workspace root
  // This ensures all packages (including @sparecarry/hooks) use the same React instance
  extraNodeModules: {
    react: reactPath,
    "react-dom": reactDomPath,
    "react/jsx-runtime": path.resolve(reactPath, "jsx-runtime.js"),
    "react/jsx-dev-runtime": path.resolve(
      reactPath,
      "jsx-dev-runtime.js"
    ),
  },
  // Use resolveRequest to ensure React always resolves from workspace root (hoisted)
  resolveRequest: (context, moduleName, platform) => {
    // Force React to resolve from workspace root (hoisted) - check for exact match first
    if (moduleName === "react") {
      // Try workspace root first (hoisted), then local
      const reactIndex = path.resolve(reactPath, "index.js");
      if (fs.existsSync(reactIndex)) {
        return { filePath: reactIndex, type: "sourceFile" };
      }
    }

    // For react/* subpaths (like react/jsx-runtime), resolve from hoisted React
    if (moduleName.startsWith("react/")) {
      const subPath = moduleName.replace("react/", "");
      const localReactSubPath = path.resolve(reactPath, subPath);
      // Try with .js extension
      const withJs = localReactSubPath + ".js";
      if (fs.existsSync(withJs)) {
        return { filePath: withJs, type: "sourceFile" };
      }
      // Try as directory with index.js
      const indexJs = path.resolve(localReactSubPath, "index.js");
      if (fs.existsSync(indexJs)) {
        return { filePath: indexJs, type: "sourceFile" };
      }
      // Try without extension (file)
      if (fs.existsSync(localReactSubPath) && fs.statSync(localReactSubPath).isFile()) {
        return { filePath: localReactSubPath, type: "sourceFile" };
      }
    }

    // Fall back to original resolver for all other modules
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
    // Metro aliases for root-level folders (allows importing from root-level code)
    alias: {
      // Force React to always resolve from workspace root (hoisted)
      "react": reactPath,
      "react-dom": reactDomPath,
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
