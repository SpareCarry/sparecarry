/**
 * Security Scanner
 *
 * Checks for security issues:
 * - Dependency vulnerabilities
 * - Security headers validation
 * - API route security checks
 * - Input sanitization validation
 * - Authentication/authorization checks
 * - Rate limiting verification
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * Check dependency vulnerabilities
 */
async function checkDependencyVulnerabilities() {
  try {
    const { stdout } = await execAsync("npm audit --json", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const audit = JSON.parse(stdout);
    const vulnerabilities = [];

    if (audit.vulnerabilities) {
      Object.entries(audit.vulnerabilities).forEach(([packageName, vuln]) => {
        vulnerabilities.push({
          package: packageName,
          severity: vuln.severity || "unknown",
          title: vuln.title || "Unknown vulnerability",
          id: vuln.id || "unknown",
          url: vuln.url || null,
        });
      });
    }

    return vulnerabilities;
  } catch (error) {
    return [{ error: `Failed to check vulnerabilities: ${error.message}` }];
  }
}

/**
 * Validate security headers
 */
function validateSecurityHeaders() {
  const issues = [];
  const middlewarePath = path.join(__dirname, "..", "middleware.ts");
  const headersPath = path.join(
    __dirname,
    "..",
    "lib",
    "security",
    "headers.ts"
  );

  // Check if security headers middleware exists
  if (!fs.existsSync(headersPath)) {
    issues.push("Security headers utility not found");
  }

  if (!fs.existsSync(middlewarePath)) {
    issues.push("Middleware file not found");
  }

  // Check if headers are applied
  if (fs.existsSync(middlewarePath)) {
    const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

    const requiredHeaders = [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
    ];

    requiredHeaders.forEach((header) => {
      if (!middlewareContent.includes(header)) {
        issues.push(`Security header ${header} not found in middleware`);
      }
    });
  }

  return issues;
}

/**
 * Check API route security
 */
function checkAPIRouteSecurity() {
  const issues = [];
  const apiDir = path.join(__dirname, "..", "app", "api");

  if (!fs.existsSync(apiDir)) {
    return issues;
  }

  // Check for unprotected routes (routes without auth checks)
  function checkRouteFile(filepath) {
    const content = fs.readFileSync(filepath, "utf8");

    // Check for common security issues
    if (
      content.includes("request.json()") &&
      !content.includes("validateRequestBody")
    ) {
      issues.push(`Route ${filepath} may lack input validation`);
    }

    if (content.includes("process.env.") && !content.includes("NEXT_PUBLIC_")) {
      // Server-side env var usage is fine
    }

    if (content.includes("eval(") || content.includes("Function(")) {
      issues.push(`Route ${filepath} uses potentially unsafe code execution`);
    }
  }

  // Recursively check all route files
  function checkDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);

      if (stats.isDirectory()) {
        checkDirectory(filepath);
      } else if (file === "route.ts" || file === "route.js") {
        checkRouteFile(filepath);
      }
    });
  }

  checkDirectory(apiDir);

  return issues;
}

/**
 * Validate input sanitization
 */
function validateInputSanitization() {
  const issues = [];
  const sanitizePath = path.join(
    __dirname,
    "..",
    "lib",
    "security",
    "sanitize.ts"
  );

  if (!fs.existsSync(sanitizePath)) {
    issues.push("Input sanitization utility not found");
    return issues;
  }

  // Check if sanitization is used in API routes
  const apiDir = path.join(__dirname, "..", "app", "api");

  if (fs.existsSync(apiDir)) {
    function checkRouteUsesSanitization(dir) {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
          checkRouteUsesSanitization(filepath);
        } else if (file === "route.ts" || file === "route.js") {
          const content = fs.readFileSync(filepath, "utf8");

          // Check if route handles user input but doesn't sanitize
          if (
            content.includes("request.json()") ||
            content.includes("request.body")
          ) {
            if (
              !content.includes("sanitize") &&
              !content.includes("escape") &&
              !content.includes("validateRequestBody")
            ) {
              issues.push(
                `Route ${filepath} handles user input but may not sanitize`
              );
            }
          }
        }
      });
    }

    checkRouteUsesSanitization(apiDir);
  }

  return issues;
}

/**
 * Check authentication/authorization patterns
 */
function checkAuthPatterns() {
  const issues = [];
  const apiDir = path.join(__dirname, "..", "app", "api");

  if (!fs.existsSync(apiDir)) {
    return issues;
  }

  function checkRouteAuth(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);

      if (stats.isDirectory()) {
        checkRouteAuth(filepath);
      } else if (file === "route.ts" || file === "route.js") {
        const content = fs.readFileSync(filepath, "utf8");
        const relativePath = path.relative(
          path.join(__dirname, ".."),
          filepath
        );

        // Check if route modifies data but doesn't check auth
        if (
          content.includes("POST") ||
          content.includes("PUT") ||
          content.includes("DELETE") ||
          content.includes("PATCH")
        ) {
          const isPublicRoute =
            relativePath.includes("/public/") ||
            relativePath.includes("/webhook/");

          if (
            !isPublicRoute &&
            !content.includes("getUser") &&
            !content.includes("auth.getUser") &&
            !content.includes("withAuthProtection")
          ) {
            issues.push(
              `Route ${relativePath} modifies data but may lack authentication check`
            );
          }
        }
      }
    });
  }

  checkRouteAuth(apiDir);

  return issues;
}

/**
 * Check rate limiting
 */
function checkRateLimiting() {
  const issues = [];
  const rateLimitPath = path.join(
    __dirname,
    "..",
    "lib",
    "security",
    "rate-limit.ts"
  );
  const apiProtectionPath = path.join(
    __dirname,
    "..",
    "lib",
    "security",
    "api-protection.ts"
  );

  if (!fs.existsSync(rateLimitPath) && !fs.existsSync(apiProtectionPath)) {
    issues.push("Rate limiting utilities not found");
    return issues;
  }

  // Check if API routes use rate limiting
  const apiDir = path.join(__dirname, "..", "app", "api");

  if (fs.existsSync(apiDir)) {
    let routesWithoutRateLimit = 0;

    function checkRouteRateLimit(dir) {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
          checkRouteRateLimit(filepath);
        } else if (file === "route.ts" || file === "route.js") {
          const content = fs.readFileSync(filepath, "utf8");

          if (
            !content.includes("rateLimit") &&
            !content.includes("withApiProtection") &&
            !content.includes("withAuthProtection")
          ) {
            routesWithoutRateLimit++;
          }
        }
      });
    }

    checkRouteRateLimit(apiDir);

    if (routesWithoutRateLimit > 0) {
      issues.push(
        `${routesWithoutRateLimit} API routes may not have rate limiting`
      );
    }
  }

  return issues;
}

/**
 * Run all security checks
 */
async function runSecurityScan() {
  console.log("🔒 Running security scan...\n");

  const [vulnerabilities, headers, apiSecurity, sanitization, auth, rateLimit] =
    await Promise.all([
      checkDependencyVulnerabilities().catch(() => []),
      Promise.resolve(validateSecurityHeaders()),
      Promise.resolve(checkAPIRouteSecurity()),
      Promise.resolve(validateInputSanitization()),
      Promise.resolve(checkAuthPatterns()),
      Promise.resolve(checkRateLimiting()),
    ]);

  const criticalVulnerabilities = vulnerabilities.filter(
    (v) => v.severity === "critical" || v.severity === "high"
  );

  const allIssues = [
    ...criticalVulnerabilities.map(
      (v) => `Critical vulnerability: ${v.package} - ${v.title}`
    ),
    ...headers.map((h) => `Security headers: ${h}`),
    ...apiSecurity,
    ...sanitization,
    ...auth,
    ...rateLimit,
  ];

  return {
    vulnerabilities: criticalVulnerabilities,
    issues: allIssues,
  };
}

module.exports = {
  runSecurityScan,
  checkDependencyVulnerabilities,
  validateSecurityHeaders,
  checkAPIRouteSecurity,
  validateInputSanitization,
  checkAuthPatterns,
  checkRateLimiting,
};
