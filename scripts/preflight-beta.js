#!/usr/bin/env node

/**
 * Preflight Check for Beta Launch
 *
 * Validates all requirements before beta deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const checks = {
  passed: [],
  failed: [],
  warnings: [],
};

function check(name, condition, message) {
  if (condition) {
    checks.passed.push(name);
    console.log(`✅ ${name}`);
  } else {
    checks.failed.push(name);
    console.error(`❌ ${name}: ${message}`);
  }
}

function warn(name, condition, message) {
  if (condition) {
    checks.passed.push(name);
    console.log(`✅ ${name}`);
  } else {
    checks.warnings.push(name);
    console.warn(`⚠️  ${name}: ${message}`);
  }
}

console.log("🔍 SpareCarry Beta Preflight Check\n");

// Environment files
check(
  ".env.staging exists",
  fs.existsSync(path.join(__dirname, "..", ".env.staging")),
  "Create .env.staging from .env.local.example"
);

// Required files
const requiredFiles = [
  "package.json",
  "capacitor.config.ts",
  "ios/fastlane/Fastfile",
  "android/fastlane/Fastfile",
  "sentry.client.config.ts",
  "sentry.server.config.ts",
];

requiredFiles.forEach((file) => {
  check(
    `${file} exists`,
    fs.existsSync(path.join(__dirname, "..", file)),
    `Missing required file: ${file}`
  );
});

// Build scripts
check(
  "Build script exists",
  fs.existsSync(path.join(__dirname, "..", "package.json")),
  "package.json missing"
);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);

check(
  "build:staging script",
  packageJson.scripts && packageJson.scripts["build:staging"],
  "Add build:staging script to package.json"
);

check(
  "mobile:build:staging script",
  packageJson.scripts && packageJson.scripts["mobile:build:staging"],
  "Add mobile:build:staging script to package.json"
);

// GitHub workflows
const workflows = [
  ".github/workflows/staging-web-deploy.yml",
  ".github/workflows/staging-mobile-build.yml",
  ".github/workflows/sentry-release.yml",
];

workflows.forEach((workflow) => {
  check(
    `${workflow} exists`,
    fs.existsSync(path.join(__dirname, "..", workflow)),
    `Missing workflow: ${workflow}`
  );
});

// Fastlane lanes
try {
  const iosFastfile = fs.readFileSync(
    path.join(__dirname, "..", "ios/fastlane/Fastfile"),
    "utf-8"
  );
  check(
    "iOS deploy_staging lane",
    iosFastfile.includes("lane :deploy_staging"),
    "Add deploy_staging lane to iOS Fastfile"
  );
} catch {
  check("iOS deploy_staging lane", false, "Cannot read iOS Fastfile");
}

try {
  const androidFastfile = fs.readFileSync(
    path.join(__dirname, "..", "android/fastlane/Fastfile"),
    "utf-8"
  );
  check(
    "Android deploy_staging lane",
    androidFastfile.includes("lane :deploy_staging"),
    "Add deploy_staging lane to Android Fastfile"
  );
} catch {
  check("Android deploy_staging lane", false, "Cannot read Android Fastfile");
}

// Git status (optional - warning only, not blocking)
try {
  const gitStatus = execSync("git status --porcelain", { encoding: "utf-8" });
  if (gitStatus.trim() === "") {
    checks.passed.push("Git working directory clean");
    console.log("✅ Git working directory clean");
  } else {
    checks.warnings.push("Git working directory clean");
    console.warn(
      "⚠️  Git working directory clean: Uncommitted changes detected (non-blocking)"
    );
  }
} catch {
  checks.warnings.push("Git working directory clean");
  console.warn(
    "⚠️  Git working directory clean: Not a git repository or git not available (non-blocking)"
  );
}

// Dependencies
try {
  execSync("pnpm list --depth=0", { stdio: "ignore" });
  check("Dependencies installed", true, "");
} catch {
  check("Dependencies installed", false, "Run: pnpm install");
}

// Environment validation
try {
  const validateEnvScript = path.join(__dirname, "validate-env.js");
  if (fs.existsSync(validateEnvScript)) {
    console.log("\n🔍 Running environment validation...\n");
    execSync(`node ${validateEnvScript} staging`, { stdio: "inherit" });
    check("Environment variables validated", true, "");
  } else {
    check(
      "Environment variables validated",
      false,
      "validate-env.js script not found"
    );
  }
} catch (error) {
  check(
    "Environment variables validated",
    false,
    "Environment validation failed - check errors above"
  );
}

// Summary
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Summary");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);
console.log(`⚠️  Warnings: ${checks.warnings.length}`);

if (checks.failed.length > 0) {
  console.log("\n❌ Preflight check FAILED");
  console.log("\nFix the following issues before deploying:");
  checks.failed.forEach((fail) => console.log(`   - ${fail}`));
  process.exit(1);
} else if (checks.warnings.length > 0) {
  console.log("\n⚠️  Preflight check passed with warnings");
  process.exit(0);
} else {
  console.log("\n✅ Preflight check PASSED");
  console.log("\nReady for beta deployment! 🚀");
  process.exit(0);
}
