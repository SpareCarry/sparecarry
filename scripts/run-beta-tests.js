/**
 * Beta Testing Script
 *
 * Runs comprehensive tests for beta readiness
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  generateDetailedReport,
  saveReportToFile,
  saveJSONReport,
  setupUnbufferedOutput,
  printStartupBanner,
} = require("./test-report-utils");

const TEST_RESULTS_DIR = path.join(__dirname, "../test-results");
const COVERAGE_DIR = path.join(__dirname, "../coverage");

// Ensure directories exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

const startTime = Date.now();
setupUnbufferedOutput();
printStartupBanner("Beta Testing Suite");

console.log("🧪 Starting Beta Testing Suite...\n");

const results = {
  typecheck: { status: "pending", output: "" },
  unitTests: { status: "pending", output: "" },
  e2eTests: { status: "pending", output: "" },
  coverage: { status: "pending", output: "" },
  timestamp: new Date().toISOString(),
};

// 1. TypeScript Type Check
console.log("1️⃣  Running TypeScript type check...");
try {
  const output = execSync("npm run typecheck", {
    encoding: "utf-8",
    stdio: "pipe",
  });
  results.typecheck = { status: "passed", output };
  console.log("✅ TypeScript type check passed\n");
} catch (error) {
  results.typecheck = { status: "failed", output: error.stdout + error.stderr };
  console.log("❌ TypeScript type check failed\n");
}

// 2. Unit Tests
console.log("2️⃣  Running unit tests...");
try {
  const output = execSync("npm run test", { encoding: "utf-8", stdio: "pipe" });
  results.unitTests = { status: "passed", output };
  console.log("✅ Unit tests passed\n");
} catch (error) {
  results.unitTests = { status: "failed", output: error.stdout + error.stderr };
  console.log("❌ Unit tests failed\n");
}

// 3. E2E Tests
console.log("3️⃣  Running E2E tests...");
try {
  const output = execSync("npm run test:e2e", {
    encoding: "utf-8",
    stdio: "pipe",
    maxBuffer: 10 * 1024 * 1024,
  });
  results.e2eTests = { status: "passed", output };
  console.log("✅ E2E tests passed\n");
} catch (error) {
  results.e2eTests = { status: "failed", output: error.stdout + error.stderr };
  console.log("❌ E2E tests failed\n");
}

// 4. Test Coverage
console.log("4️⃣  Generating test coverage...");
try {
  const output = execSync("npm run coverage", {
    encoding: "utf-8",
    stdio: "pipe",
  });
  results.coverage = { status: "passed", output };
  console.log("✅ Test coverage generated\n");
} catch (error) {
  results.coverage = { status: "failed", output: error.stdout + error.stderr };
  console.log("❌ Test coverage generation failed\n");
}

const endTime = Date.now();

// Convert results to report format
const reportResults = [
  {
    feature: "TypeScript Type Check",
    passed: results.typecheck.status === "passed",
    output: results.typecheck.output,
    error: results.typecheck.status === "failed" ? "Type check failed" : null,
  },
  {
    feature: "Unit Tests",
    passed: results.unitTests.status === "passed",
    output: results.unitTests.output,
    error: results.unitTests.status === "failed" ? "Unit tests failed" : null,
  },
  {
    feature: "E2E Tests",
    passed: results.e2eTests.status === "passed",
    output: results.e2eTests.output,
    error: results.e2eTests.status === "failed" ? "E2E tests failed" : null,
  },
  {
    feature: "Test Coverage",
    passed: results.coverage.status === "passed",
    output: results.coverage.output,
    error:
      results.coverage.status === "failed"
        ? "Coverage generation failed"
        : null,
  },
];

const passed = reportResults.filter((r) => r.passed).length;
const failed = reportResults.filter((r) => !r.passed).length;

// Generate detailed report
const report = generateDetailedReport(
  "Beta Testing Suite",
  reportResults,
  passed,
  failed,
  {
    startTime,
    endTime,
    environment: {
      NODE_ENV: process.env.NODE_ENV || "not set",
      CI: process.env.CI || "false",
    },
  }
);

// Save results
const resultsFile = path.join(
  TEST_RESULTS_DIR,
  `beta-test-results-${Date.now()}.json`
);
fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

// Save detailed report
const reportSave = saveReportToFile(
  report,
  "test-results-beta-detailed.txt",
  TEST_RESULTS_DIR
);
if (reportSave.success) {
  console.log(`\n📝 Detailed report saved to: ${reportSave.path}`);
}

// Generate summary
const summary = {
  timestamp: results.timestamp,
  typecheck: results.typecheck.status,
  unitTests: results.unitTests.status,
  e2eTests: results.e2eTests.status,
  coverage: results.coverage.status,
  allPassed:
    results.typecheck.status === "passed" &&
    results.unitTests.status === "passed" &&
    results.e2eTests.status === "passed",
};

console.log("\n📊 Beta Testing Summary:");
console.log("========================");
console.log(`TypeScript: ${summary.typecheck === "passed" ? "✅" : "❌"}`);
console.log(`Unit Tests: ${summary.unitTests === "passed" ? "✅" : "❌"}`);
console.log(`E2E Tests: ${summary.e2eTests === "passed" ? "✅" : "❌"}`);
console.log(`Coverage: ${summary.coverage === "passed" ? "✅" : "❌"}`);
console.log(
  `\nOverall: ${summary.allPassed ? "✅ READY FOR BETA" : "❌ ISSUES FOUND"}`
);
console.log(`\nFull results saved to: ${resultsFile}`);

console.log("\n" + "=".repeat(70));
console.log("📄 DETAILED REPORT");
console.log("=".repeat(70));
console.log(report);

// Exit with appropriate code
process.exit(summary.allPassed ? 0 : 1);
