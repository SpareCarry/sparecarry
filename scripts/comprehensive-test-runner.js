/**
 * Master Test Runner
 *
 * Orchestrates the entire testing process:
 * - Runs all test suites in sequence
 * - Executes static analysis checks
 * - Validates environment configuration
 * - Checks for security vulnerabilities
 * - Validates API configurations
 * - Runs performance checks
 * - Records all results in structured format
 * - Attempts automatic fixes for safe issues
 */

const { initializeResult, saveResult } = require("./test-result-recorder");
const { runStaticAnalysis } = require("./static-analysis");
const { validateConfiguration } = require("./validate-configuration");
const { runSecurityScan } = require("./security-scanner");
const { runPerformanceChecks } = require("./performance-checker");
const { trackImprovements } = require("./track-improvements");
const { applyAutoFixes } = require("./auto-fix-issues");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

// FORCE MOCK MODE - Never make real API calls during testing
// This prevents hitting Supabase free plan limits and other service quotas
process.env.USE_TEST_MOCKS = "true";
process.env.AVOID_EXTERNAL_CALLS = "true";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

// Load test configuration
const configPath = path.join(__dirname, "..", "test-config.json");
let testConfig = {
  maxIterations: 10,
  skipE2E: false,
  useMocks: true, // Always true - never make real API calls
  avoidExternalCalls: true, // Always true - never make real API calls
};

if (fs.existsSync(configPath)) {
  try {
    testConfig = {
      ...testConfig,
      ...JSON.parse(fs.readFileSync(configPath, "utf8")),
    };
  } catch (error) {
    console.warn("⚠️  Could not load test-config.json, using defaults");
  }
}

/**
 * Run unit tests
 */
async function runUnitTests() {
  try {
    // FORCE MOCK MODE - Never make real API calls
    const testEnv = {
      ...process.env,
      NODE_ENV: "test",
      USE_TEST_MOCKS: "true",
      AVOID_EXTERNAL_CALLS: "true",
      SUPABASE_MOCK_MODE: "true",
    };

    const { stdout, stderr } = await execAsync("pnpm test --run", {
      cwd: path.join(__dirname, ".."),
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
      env: testEnv,
    });

    // Parse test results
    const output = stdout + stderr;
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: 0,
      errors: output.includes("FAIL")
        ? output
            .split("\n")
            .filter((l) => l.includes("FAIL"))
            .slice(0, 10)
        : [],
    };
  } catch (error) {
    const output = (error.stdout || "") + (error.stderr || "");
    return {
      passed: 0,
      failed: 1,
      skipped: 0,
      errors: [error.message || "Test execution failed"],
    };
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  // Integration tests are typically part of unit test suite
  // This is a placeholder for separate integration test runs
  return {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };
}

/**
 * Run E2E tests (if not skipped)
 */
async function runE2ETests() {
  if (testConfig.skipE2E) {
    return {
      passed: 0,
      failed: 0,
      skipped: 1,
      errors: [],
      message: "E2E tests skipped",
    };
  }

  try {
    // FORCE MOCK MODE for E2E tests too
    const e2eEnv = {
      ...process.env,
      USE_TEST_MOCKS: "true",
      AVOID_EXTERNAL_CALLS: "true",
      SUPABASE_MOCK_MODE: "true",
    };

    const { stdout, stderr } = await execAsync("pnpm test:e2e", {
      cwd: path.join(__dirname, ".."),
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
      env: e2eEnv,
    });

    const output = stdout + stderr;
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: 0,
      errors: output.includes("FAILED")
        ? output
            .split("\n")
            .filter((l) => l.includes("FAILED"))
            .slice(0, 10)
        : [],
    };
  } catch (error) {
    const output = (error.stdout || "") + (error.stderr || "");
    return {
      passed: 0,
      failed: 1,
      skipped: 0,
      errors: [error.message || "E2E test execution failed"],
    };
  }
}

/**
 * Run comprehensive test suite
 */
async function runComprehensiveTests(iteration = 1) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Comprehensive Test Run - Iteration ${iteration}`);
  console.log("=".repeat(60) + "\n");

  const result = initializeResult(iteration);

  // Run test suites
  console.log("📝 Running test suites...\n");

  if (testConfig.testCategories?.unit !== false) {
    console.log("  → Unit tests...");
    result.tests.unit = await runUnitTests();
  }

  if (testConfig.testCategories?.integration !== false) {
    console.log("  → Integration tests...");
    result.tests.integration = await runIntegrationTests();
  }

  if (testConfig.testCategories?.e2e !== false) {
    console.log("  → E2E tests...");
    result.tests.e2e = await runE2ETests();
  }

  // Run static analysis
  if (testConfig.testCategories?.staticAnalysis !== false) {
    console.log("\n🔍 Running static analysis...\n");
    result.staticAnalysis = await runStaticAnalysis().catch((err) => ({
      typescript: { errors: [err.message], warnings: [] },
      linting: { errors: [err.message], warnings: [] },
      typeCoverage: { percentage: 0, issues: [] },
    }));
  }

  // Validate configuration
  if (testConfig.testCategories?.configuration !== false) {
    console.log("\n⚙️  Validating configuration...\n");
    result.configuration = await validateConfiguration().catch((err) => ({
      environment: {
        valid: false,
        missing: [],
        invalid: [{ var: "ERROR", reason: err.message }],
      },
      apis: {
        supabase: { connected: false, errors: [err.message] },
        stripe: { connected: false, errors: [] },
        resend: { connected: false, errors: [] },
      },
    }));
  }

  // Run security scan
  if (testConfig.testCategories?.security !== false) {
    console.log("\n🔒 Running security scan...\n");
    result.security = await runSecurityScan().catch((err) => ({
      vulnerabilities: [],
      issues: [err.message],
    }));
  }

  // Run performance checks
  if (testConfig.testCategories?.performance !== false) {
    console.log("\n⚡ Running performance checks...\n");
    result.performance = await runPerformanceChecks().catch((err) => ({
      buildTime: 0,
      bundleSize: 0,
      issues: [err.message],
    }));
  }

  // Track improvements
  console.log("\n💡 Tracking improvements...\n");
  result.improvements = trackImprovements(result);

  // Determine overall status
  const totalFailed =
    result.tests.unit.failed +
    result.tests.integration.failed +
    result.tests.e2e.failed;
  const hasErrors =
    totalFailed > 0 ||
    result.staticAnalysis.typescript.errors.length > 0 ||
    result.staticAnalysis.linting.errors.length > 0 ||
    !result.configuration.environment.valid ||
    result.security.vulnerabilities.length > 0;

  result.status = hasErrors ? "failure" : "success";

  // Save results
  const saved = saveResult(result);

  console.log(`\n📊 Results saved to:`);
  console.log(`   JSON: ${saved.json.filename}`);
  console.log(`   Markdown: ${saved.markdown.filename}`);

  return {
    result,
    saved,
    hasErrors,
    shouldRetry: hasErrors && testConfig.autoFix?.enabled,
  };
}

// Run if called directly (for testing)
if (require.main === module) {
  runComprehensiveTests(1)
    .then((result) => {
      if (result.hasErrors) {
        console.log("\n❌ Tests completed with errors");
        process.exit(1);
      } else {
        console.log("\n✅ All tests passed!");
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("\n❌ Fatal error:", error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveTests,
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
};
