// pnpmfile.cjs - Support React 19 for Expo SDK 54
function readPackage(pkg, context) {
  // Allow React 19 (Expo SDK 54 supports it)
  // Only adjust peer dependencies that are too restrictive
  if (pkg.peerDependencies) {
    if (
      pkg.peerDependencies.react &&
      !pkg.peerDependencies.react.includes("19") &&
      !pkg.peerDependencies.react.includes("18")
    ) {
      context.log("Adjusting react peer dependency in " + pkg.name);
      pkg.peerDependencies.react = "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0";
    }
    if (
      pkg.peerDependencies["react-dom"] &&
      !pkg.peerDependencies["react-dom"].includes("19") &&
      !pkg.peerDependencies["react-dom"].includes("18")
    ) {
      context.log("Adjusting react-dom peer dependency in " + pkg.name);
      pkg.peerDependencies["react-dom"] = "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0";
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
