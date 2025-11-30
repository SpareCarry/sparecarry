// pnpmfile.cjs - Force React 18 resolution
function readPackage(pkg, context) {
  // Force React 18 for all dependencies
  if (pkg.dependencies) {
    if (pkg.dependencies.react && pkg.dependencies.react !== "18.3.1") {
      context.log("Overriding react version in " + pkg.name + " to 18.3.1");
      pkg.dependencies.react = "18.3.1";
    }
    if (
      pkg.dependencies["react-dom"] &&
      pkg.dependencies["react-dom"] !== "18.3.1"
    ) {
      context.log("Overriding react-dom version in " + pkg.name + " to 18.3.1");
      pkg.dependencies["react-dom"] = "18.3.1";
    }
  }
  if (pkg.peerDependencies) {
    if (
      pkg.peerDependencies.react &&
      !pkg.peerDependencies.react.includes("18")
    ) {
      context.log("Adjusting react peer dependency in " + pkg.name);
      pkg.peerDependencies.react = "^16.5.1 || ^17.0.0 || ^18.0.0";
    }
    if (
      pkg.peerDependencies["react-dom"] &&
      !pkg.peerDependencies["react-dom"].includes("18")
    ) {
      context.log("Adjusting react-dom peer dependency in " + pkg.name);
      pkg.peerDependencies["react-dom"] = "^16.5.1 || ^17.0.0 || ^18.0.0";
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
