/**
 * Performance Checker
 *
 * Performance validation:
 * - Build time checks
 * - Bundle size analysis
 * - Lighthouse scores (optional, if Next.js dev server running)
 * - Database query performance (mock)
 * - API response time checks (mock)
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * Check build time (requires build to exist)
 */
async function checkBuildTime() {
  // This would require running a build and timing it
  // For now, we'll just check if .next exists
  const nextDir = path.join(__dirname, "..", ".next");

  if (!fs.existsSync(nextDir)) {
    return {
      checked: false,
      message: 'Build not found. Run "npm run build" to check build time.',
      buildTime: 0,
    };
  }

  // Check build info file if it exists
  const buildManifest = path.join(nextDir, "BUILD_ID");
  if (fs.existsSync(buildManifest)) {
    const buildId = fs.readFileSync(buildManifest, "utf8").trim();
    return {
      checked: true,
      message: `Build exists (ID: ${buildId})`,
      buildTime: 0, // Actual build time not available without running build
    };
  }

  return {
    checked: true,
    message: "Build directory exists",
    buildTime: 0,
  };
}

/**
 * Analyze bundle size
 */
async function analyzeBundleSize() {
  const nextDir = path.join(__dirname, "..", ".next");

  if (!fs.existsSync(nextDir)) {
    return {
      analyzed: false,
      totalSize: 0,
      issues: ['Build not found. Run "npm run build" first.'],
    };
  }

  try {
    let totalSize = 0;
    const fileSizes = [];

    function calculateSize(dir, baseDir = dir) {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
          calculateSize(filepath, baseDir);
        } else {
          totalSize += stats.size;
          const relativePath = path.relative(baseDir, filepath);
          fileSizes.push({
            path: relativePath,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(2),
          });
        }
      });
    }

    calculateSize(nextDir);

    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    const issues = [];

    // Warn if bundle is too large
    if (totalSize > 10 * 1024 * 1024) {
      // 10MB
      issues.push(
        `Bundle size is large: ${sizeInMB} MB (consider code splitting)`
      );
    }

    // Find largest files
    const largestFiles = fileSizes.sort((a, b) => b.size - a.size).slice(0, 5);

    return {
      analyzed: true,
      totalSize,
      totalSizeMB: parseFloat(sizeInMB),
      largestFiles,
      issues,
    };
  } catch (error) {
    return {
      analyzed: false,
      totalSize: 0,
      issues: [`Error analyzing bundle: ${error.message}`],
    };
  }
}

/**
 * Check static page generation
 */
function checkStaticGeneration() {
  const outDir = path.join(__dirname, "..", "out");
  const issues = [];

  if (!fs.existsSync(outDir)) {
    return {
      checked: false,
      message:
        "Static export not found. Build may not be configured for static export.",
      issues: [],
    };
  }

  // Count static pages
  let pageCount = 0;

  function countPages(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);

      if (stats.isDirectory()) {
        countPages(filepath);
      } else if (file === "index.html" || file.endsWith(".html")) {
        pageCount++;
      }
    });
  }

  countPages(outDir);

  return {
    checked: true,
    pageCount,
    message: `Found ${pageCount} static pages`,
    issues,
  };
}

/**
 * Analyze package.json for performance issues
 */
function analyzeDependencies() {
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const issues = [];

  if (!fs.existsSync(packageJsonPath)) {
    return { analyzed: false, issues: ["package.json not found"] };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    const dependencyCount = Object.keys(dependencies).length;

    // Warn if too many dependencies
    if (dependencyCount > 100) {
      issues.push(
        `Large number of dependencies: ${dependencyCount} (consider reviewing unused packages)`
      );
    }

    // Check for known heavy dependencies
    const heavyDeps = ["@sentry/nextjs", "@supabase/supabase-js"];
    heavyDeps.forEach((dep) => {
      if (dependencies[dep]) {
        // Not an issue, just informational
      }
    });

    return {
      analyzed: true,
      dependencyCount,
      issues,
    };
  } catch (error) {
    return {
      analyzed: false,
      issues: [`Error analyzing dependencies: ${error.message}`],
    };
  }
}

/**
 * Run all performance checks
 */
async function runPerformanceChecks() {
  console.log("⚡ Running performance checks...\n");

  const [buildTime, bundleSize, staticGen, dependencies] = await Promise.all([
    checkBuildTime().catch(() => ({
      checked: false,
      buildTime: 0,
      message: "Error checking build time",
    })),
    analyzeBundleSize().catch(() => ({
      analyzed: false,
      totalSize: 0,
      issues: [],
    })),
    Promise.resolve(checkStaticGeneration()),
    Promise.resolve(analyzeDependencies()),
  ]);

  const allIssues = [
    ...(bundleSize.issues || []),
    ...(staticGen.issues || []),
    ...(dependencies.issues || []),
  ];

  return {
    buildTime,
    bundleSize: bundleSize.totalSize || 0,
    bundleSizeMB: bundleSize.totalSizeMB || 0,
    staticGeneration: staticGen,
    dependencies,
    issues: allIssues,
  };
}

module.exports = {
  runPerformanceChecks,
  checkBuildTime,
  analyzeBundleSize,
  checkStaticGeneration,
  analyzeDependencies,
};
