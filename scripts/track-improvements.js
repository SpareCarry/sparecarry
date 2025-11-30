/**
 * Improvement Tracker
 *
 * Tracks improvement suggestions:
 * - Missing environment variables
 * - Missing API endpoints
 * - Missing test coverage
 * - Performance optimization opportunities
 * - Security enhancement suggestions
 * - Code quality improvements
 * - Documentation gaps
 */

const fs = require("fs");
const path = require("path");

/**
 * Track missing environment variables
 */
function trackMissingEnvVars(envValidation) {
  const missing = [];

  if (envValidation.missing) {
    envValidation.missing.forEach((varName) => {
      missing.push(`Missing environment variable: ${varName}`);
    });
  }

  if (envValidation.invalid) {
    envValidation.invalid.forEach((item) => {
      missing.push(`Invalid environment variable ${item.var}: ${item.reason}`);
    });
  }

  return missing;
}

/**
 * Track missing API endpoints
 */
function trackMissingAPIEndpoints() {
  const suggestions = [];
  const apiDir = path.join(__dirname, "..", "app", "api");

  if (!fs.existsSync(apiDir)) {
    return suggestions;
  }

  // Check for common missing endpoints
  const expectedEndpoints = ["auth/callback", "health", "webhooks/stripe"];

  expectedEndpoints.forEach((endpoint) => {
    const endpointPath = path.join(apiDir, endpoint, "route.ts");
    if (!fs.existsSync(endpointPath)) {
      suggestions.push(`Consider adding API endpoint: /api/${endpoint}`);
    }
  });

  return suggestions;
}

/**
 * Track missing test coverage
 */
function trackMissingTestCoverage() {
  const suggestions = [];
  const appDir = path.join(__dirname, "..", "app");
  const componentsDir = path.join(__dirname, "..", "components");
  const libDir = path.join(__dirname, "..", "lib");
  const testsDir = path.join(__dirname, "..", "tests");

  // Check for files without tests
  function findFilesWithoutTests(dir, baseDir = dir) {
    const missing = [];

    if (!fs.existsSync(dir)) return missing;

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);

      if (stats.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (
          !file.startsWith(".") &&
          file !== "node_modules" &&
          file !== "out"
        ) {
          missing.push(...findFilesWithoutTests(filepath, baseDir));
        }
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        // Check if test file exists
        const relativePath = path.relative(baseDir, filepath);
        const testPath = path.join(
          testsDir,
          relativePath.replace(/\.(ts|tsx)$/, ".test.$1")
        );

        if (!fs.existsSync(testPath)) {
          // Don't add every file, just key files
          if (
            filepath.includes("lib/") ||
            filepath.includes("utils/") ||
            filepath.includes("services/")
          ) {
            missing.push(`No test file found for: ${relativePath}`);
          }
        }
      }
    });

    return missing;
  }

  const missingTests = [
    ...findFilesWithoutTests(libDir).slice(0, 10), // Limit to first 10
  ];

  if (missingTests.length > 0) {
    suggestions.push(`Consider adding tests for ${missingTests.length} files`);
  }

  return suggestions;
}

/**
 * Track performance optimization opportunities
 */
function trackPerformanceOptimizations(performanceResults) {
  const suggestions = [];

  if (performanceResults.bundleSize > 5 * 1024 * 1024) {
    // 5MB
    suggestions.push(
      "Bundle size is large - consider code splitting and lazy loading"
    );
  }

  if (
    performanceResults.dependencies &&
    performanceResults.dependencies.dependencyCount > 100
  ) {
    suggestions.push(
      "Large number of dependencies - consider reviewing and removing unused packages"
    );
  }

  return suggestions;
}

/**
 * Track security enhancement suggestions
 */
function trackSecurityEnhancements(securityResults) {
  const suggestions = [];

  if (securityResults.issues && securityResults.issues.length > 0) {
    securityResults.issues.forEach((issue) => {
      if (issue.includes("rate limiting")) {
        suggestions.push("Add rate limiting to API routes");
      }
      if (issue.includes("sanitize")) {
        suggestions.push("Ensure all user inputs are sanitized");
      }
    });
  }

  return suggestions;
}

/**
 * Track code quality improvements
 */
function trackCodeQualityImprovements(staticAnalysis) {
  const suggestions = [];

  if (
    staticAnalysis.typeCoverage &&
    staticAnalysis.typeCoverage.percentage < 80
  ) {
    suggestions.push(
      `Type coverage is ${staticAnalysis.typeCoverage.percentage}% - aim for 80%+`
    );
  }

  if (staticAnalysis.deadCode && staticAnalysis.deadCode.found > 0) {
    suggestions.push(
      `Found ${staticAnalysis.deadCode.found} potentially unused exports - consider removing dead code`
    );
  }

  if (staticAnalysis.linting && staticAnalysis.linting.errors.length > 0) {
    suggestions.push(
      `Fix ${staticAnalysis.linting.errors.length} linting errors`
    );
  }

  return suggestions;
}

/**
 * Track documentation gaps
 */
function trackDocumentationGaps() {
  const suggestions = [];
  const docsDir = path.join(__dirname, "..", "docs");
  const readmePath = path.join(__dirname, "..", "README.md");

  // Check for README
  if (!fs.existsSync(readmePath)) {
    suggestions.push("Add README.md with setup instructions");
  }

  // Check for API documentation
  const apiDir = path.join(__dirname, "..", "app", "api");
  if (fs.existsSync(apiDir) && !fs.existsSync(path.join(docsDir, "API.md"))) {
    suggestions.push("Consider adding API documentation");
  }

  return suggestions;
}

/**
 * Track missing error handling
 */
function trackMissingErrorHandling() {
  const suggestions = [];
  const apiDir = path.join(__dirname, "..", "app", "api");

  if (!fs.existsSync(apiDir)) {
    return suggestions;
  }

  // Check for routes without error handling
  function checkErrorHandling(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);

      if (stats.isDirectory()) {
        checkErrorHandling(filepath);
      } else if (file === "route.ts" || file === "route.js") {
        const content = fs.readFileSync(filepath, "utf8");
        const relativePath = path.relative(
          path.join(__dirname, ".."),
          filepath
        );

        // Check for async functions without try-catch
        if (
          content.includes("async") &&
          !content.includes("try") &&
          !content.includes("catch")
        ) {
          // Only suggest for complex routes
          if (content.split("\n").length > 20) {
            suggestions.push(
              `Route ${relativePath} may benefit from error handling`
            );
          }
        }
      }
    });
  }

  checkErrorHandling(apiDir);

  return suggestions.slice(0, 5); // Limit suggestions
}

/**
 * Generate all improvement suggestions
 */
function trackImprovements(testResults) {
  const missing = [];
  const suggestions = [];

  // Track missing env vars
  if (testResults.configuration && testResults.configuration.environment) {
    missing.push(...trackMissingEnvVars(testResults.configuration.environment));
  }

  // Track missing API endpoints
  suggestions.push(...trackMissingAPIEndpoints());

  // Track missing test coverage
  suggestions.push(...trackMissingTestCoverage());

  // Track performance optimizations
  if (testResults.performance) {
    suggestions.push(...trackPerformanceOptimizations(testResults.performance));
  }

  // Track security enhancements
  if (testResults.security) {
    suggestions.push(...trackSecurityEnhancements(testResults.security));
  }

  // Track code quality
  if (testResults.staticAnalysis) {
    suggestions.push(
      ...trackCodeQualityImprovements(testResults.staticAnalysis)
    );
  }

  // Track documentation gaps
  suggestions.push(...trackDocumentationGaps());

  // Track missing error handling
  suggestions.push(...trackMissingErrorHandling());

  return {
    missing,
    suggestions: [...new Set(suggestions)], // Remove duplicates
  };
}

module.exports = {
  trackImprovements,
  trackMissingEnvVars,
  trackMissingAPIEndpoints,
  trackMissingTestCoverage,
  trackPerformanceOptimizations,
  trackSecurityEnhancements,
  trackCodeQualityImprovements,
  trackDocumentationGaps,
  trackMissingErrorHandling,
};
