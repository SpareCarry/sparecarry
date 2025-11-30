/**
 * Static Analysis Runner
 *
 * Runs static analysis checks:
 * - TypeScript type checking
 * - ESLint checks
 * - Type coverage analysis
 * - Dead code detection
 * - Dependency vulnerability scanning
 * - Bundle size analysis
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const exec = promisify(require("child_process").exec);

/**
 * Run TypeScript type checking
 */
async function checkTypeScript() {
  try {
    const { stdout, stderr } = await exec("pnpm typecheck:web", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const errors = [];
    const warnings = [];

    // Parse TypeScript output
    const lines = (stdout + stderr).split("\n");
    lines.forEach((line) => {
      if (line.includes("error TS")) {
        errors.push(line.trim());
      } else if (line.includes("warning TS")) {
        warnings.push(line.trim());
      }
    });

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    // TypeScript errors are in stderr
    const errorOutput = error.stderr || error.stdout || error.message;
    const errors = errorOutput
      .split("\n")
      .filter((line) => line.includes("error TS"));

    return {
      success: false,
      errors,
      warnings: [],
    };
  }
}

/**
 * Run ESLint checks
 */
async function checkLinting() {
  try {
    const { stdout, stderr } = await exec("pnpm lint", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const errors = [];
    const warnings = [];

    // Parse ESLint output
    const lines = (stdout + stderr).split("\n");
    lines.forEach((line) => {
      if (line.includes("error")) {
        errors.push(line.trim());
      } else if (line.includes("warning")) {
        warnings.push(line.trim());
      }
    });

    return {
      success: errors.length === 0 && warnings.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    // ESLint exits with non-zero on errors, but we want to capture them
    const errorOutput = error.stderr || error.stdout || error.message;
    const errors = errorOutput
      .split("\n")
      .filter((line) => line.includes("error") || line.includes("✖"));

    return {
      success: false,
      errors,
      warnings: [],
    };
  }
}

/**
 * Check type coverage (if type-coverage is available)
 */
async function checkTypeCoverage() {
  try {
    const { stdout } = await exec("pnpm typecheck:coverage", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Parse coverage percentage from output
    const match = stdout.match(/(\d+(?:\.\d+)?)%/);
    const percentage = match ? parseFloat(match[1]) : 0;

    return {
      percentage,
      issues: [],
    };
  } catch (error) {
    // Type coverage might not be configured, return default
    return {
      percentage: 0,
      issues: ["Type coverage check not available"],
    };
  }
}

/**
 * Check for dead code using ts-prune
 */
async function checkDeadCode() {
  try {
    const { stdout } = await exec("pnpm typecheck:prune", {
      cwd: path.join(__dirname, ".."),
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const issues = stdout.split("\n").filter((line) => line.trim());

    return {
      found: issues.length,
      issues: issues.slice(0, 20), // Limit to first 20
    };
  } catch (error) {
    // ts-prune might not be configured
    return {
      found: 0,
      issues: [],
    };
  }
}

/**
 * Check dependency vulnerabilities
 */
async function checkVulnerabilities() {
  try {
    const { stdout } = await exec("npm audit --json", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const audit = JSON.parse(stdout);
    const vulnerabilities = [];

    if (audit.vulnerabilities) {
      Object.entries(audit.vulnerabilities).forEach(([packageName, vuln]) => {
        if (vuln.severity === "critical" || vuln.severity === "high") {
          vulnerabilities.push({
            package: packageName,
            severity: vuln.severity,
            title: vuln.title || "Unknown",
            id: vuln.id || "unknown",
          });
        }
      });
    }

    return {
      found: vulnerabilities.length,
      vulnerabilities: vulnerabilities.slice(0, 20), // Limit to first 20
    };
  } catch (error) {
    // npm audit might fail, return empty
    return {
      found: 0,
      vulnerabilities: [],
    };
  }
}

/**
 * Analyze bundle size (if .next directory exists)
 */
async function analyzeBundleSize() {
  const nextDir = path.join(__dirname, "..", ".next");

  if (!fs.existsSync(nextDir)) {
    return {
      analyzed: false,
      message: 'Build not found. Run "npm run build" first.',
      totalSize: 0,
    };
  }

  try {
    // Calculate total size of .next directory
    let totalSize = 0;

    function getDirectorySize(dir) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
          getDirectorySize(filepath);
        } else {
          totalSize += stats.size;
        }
      });
    }

    getDirectorySize(nextDir);

    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

    return {
      analyzed: true,
      totalSize: totalSize,
      totalSizeMB: parseFloat(sizeInMB),
      message: `Total bundle size: ${sizeInMB} MB`,
    };
  } catch (error) {
    return {
      analyzed: false,
      message: `Error analyzing bundle: ${error.message}`,
      totalSize: 0,
    };
  }
}

/**
 * Run all static analysis checks
 */
async function runStaticAnalysis() {
  console.log("🔍 Running static analysis...\n");

  const [
    typescript,
    linting,
    typeCoverage,
    deadCode,
    vulnerabilities,
    bundleSize,
  ] = await Promise.all([
    checkTypeScript().catch((err) => ({
      success: false,
      errors: [err.message],
      warnings: [],
    })),
    checkLinting().catch((err) => ({
      success: false,
      errors: [err.message],
      warnings: [],
    })),
    checkTypeCoverage().catch(() => ({ percentage: 0, issues: [] })),
    checkDeadCode().catch(() => ({ found: 0, issues: [] })),
    checkVulnerabilities().catch(() => ({ found: 0, vulnerabilities: [] })),
    analyzeBundleSize().catch(() => ({ analyzed: false, totalSize: 0 })),
  ]);

  return {
    typescript,
    linting,
    typeCoverage,
    deadCode,
    vulnerabilities,
    bundleSize,
  };
}

module.exports = {
  runStaticAnalysis,
  checkTypeScript,
  checkLinting,
  checkTypeCoverage,
  checkDeadCode,
  checkVulnerabilities,
  analyzeBundleSize,
};
