/**
 * Verify that React 19.1.0 is installed locally and not being resolved from pnpm
 */

const fs = require("fs");
const path = require("path");

const projectRoot = __dirname + "/..";
const localReactPath = path.join(
  projectRoot,
  "node_modules",
  "react",
  "package.json"
);

console.log("🔍 Verifying React installation...\n");

if (!fs.existsSync(localReactPath)) {
  console.error("❌ ERROR: React not found in apps/mobile/node_modules/react");
  console.error("   Run: cd apps/mobile && npm install");
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(localReactPath, "utf8"));
const version = packageJson.version;

if (version !== "19.1.0") {
  console.error(`❌ ERROR: React version mismatch!`);
  console.error(`   Expected: 19.1.0`);
  console.error(`   Found: ${version}`);
  console.error("   Run: cd apps/mobile && npm install react@19.1.0");
  process.exit(1);
}

console.log(`✅ React ${version} found in local node_modules`);
console.log("✅ React version is correct\n");

// Check for pnpm symlinks
const reactDir = path.join(projectRoot, "node_modules", "react");
try {
  const stats = fs.lstatSync(reactDir);
  if (stats.isSymbolicLink()) {
    console.warn("⚠️  WARNING: React is a symlink (possibly from pnpm)");
    console.warn("   This may cause version conflicts.");
    console.warn("   Consider using npm instead of pnpm for apps/mobile");
  } else {
    console.log("✅ React is a real directory (not a symlink)");
  }
} catch (e) {
  console.warn("⚠️  Could not check if React is a symlink:", e.message);
}

console.log("\n✅ React setup verified!");
