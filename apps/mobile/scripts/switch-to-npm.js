/**
 * Script to switch mobile app to use npm instead of pnpm
 * This is a workaround for Metro bundler + pnpm compatibility issues
 *
 * IMPORTANT: npm doesn't support workspace:* protocol
 * This script creates a temporary package.json without workspace deps
 * and links the workspace packages manually
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");
const nodeModulesPath = path.join(projectRoot, "node_modules");
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJsonBackupPath = path.join(
  projectRoot,
  "package.json.pnpm-backup"
);

console.log("");
console.log("========================================");
console.log("🔄 SWITCHING TO NPM (WORKAROUND)");
console.log("========================================");
console.log("");
console.log("⚠️  This is a workaround for Metro + pnpm hasMagic error");
console.log("   npm will be used only for the mobile app");
console.log("");

// Read current package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// Backup original package.json
if (!fs.existsSync(packageJsonBackupPath)) {
  fs.writeFileSync(packageJsonBackupPath, JSON.stringify(packageJson, null, 2));
  console.log("✅ Backed up original package.json");
}

// Replace workspace:* dependencies with file: paths
const workspaceRoot = path.resolve(projectRoot, "../..");
const npmPackageJson = { ...packageJson };

// Replace workspace dependencies
if (npmPackageJson.dependencies) {
  Object.keys(npmPackageJson.dependencies).forEach((key) => {
    if (npmPackageJson.dependencies[key] === "workspace:*") {
      const workspacePath = path.join(
        workspaceRoot,
        "packages",
        key.replace("@sparecarry/", "")
      );
      if (fs.existsSync(workspacePath)) {
        npmPackageJson.dependencies[key] = `file:${workspacePath}`;
        console.log(`   Replaced ${key} with file: path`);
      } else {
        console.warn(
          `   ⚠️  Workspace package ${key} not found, keeping workspace:*`
        );
      }
    }
  });
}

// Write npm-compatible package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(npmPackageJson, null, 2));
console.log("✅ Created npm-compatible package.json");
console.log("");

// Remove node_modules if exists
if (fs.existsSync(nodeModulesPath)) {
  console.log("⚠️  Removing existing node_modules...");
  try {
    if (process.platform === "win32") {
      execSync(
        `powershell -Command "Remove-Item -Recurse -Force '${nodeModulesPath}'"`,
        { stdio: "inherit" }
      );
    } else {
      execSync(`rm -rf ${nodeModulesPath}`, { stdio: "inherit" });
    }
    console.log("✅ Removed node_modules");
  } catch (error) {
    console.error("❌ Failed to remove node_modules:", error.message);
    process.exit(1);
  }
}

console.log("");
console.log("📦 Installing with npm...");
console.log("");

try {
  execSync("npm install", {
    cwd: projectRoot,
    stdio: "inherit",
  });

  console.log("");
  console.log("✅ Installation complete!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("   1. Run: npm start");
  console.log("   2. The hasMagic error should be fixed!");
  console.log("");
  console.log("⚠️  Note: package.json was modified for npm");
  console.log("   Original saved as: package.json.pnpm-backup");
  console.log("   To restore: copy package.json.pnpm-backup to package.json");
  console.log("");
} catch (error) {
  console.error("");
  console.error("❌ npm install failed:", error.message);
  console.error("");
  console.error("Restoring original package.json...");
  if (fs.existsSync(packageJsonBackupPath)) {
    fs.copyFileSync(packageJsonBackupPath, packageJsonPath);
    console.error("✅ Restored original package.json");
  }
  console.error("");
  console.error("Try: pnpm install (to restore node_modules)");
  process.exit(1);
}
