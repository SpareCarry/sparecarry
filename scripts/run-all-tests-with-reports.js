/**
 * Master test runner - runs all tests and generates comprehensive reports
 * Usage: node scripts/run-all-tests-with-reports.js
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

const startTime = Date.now();
setupUnbufferedOutput();
printStartupBanner("Complete Test Suite - All Tests");

const results = [];
const testSuites = [
  {
    name: "Comprehensive Tests",
    command: "pnpm test:comprehensive",
    outputFile: "test-results-comprehensive.txt",
  },
  {
    name: "All Features Tests",
    command: "pnpm test:features",
    outputFile: "test-results-all-features.txt",
  },
  {
    name: "Unit Tests (Vitest)",
    command: "node scripts/run-vitest-with-report.js",
    outputFile: "test-results-vitest.txt",
  },
  {
    name: "E2E Tests (Playwright)",
    command: "node scripts/run-playwright-with-report.js",
    outputFile: "test-results-playwright.txt",
  },
  {
    name: "Beta Readiness",
    command: "node scripts/verify-beta-readiness.js",
    outputFile: "test-results-beta-readiness.txt",
  },
];

console.log("Running all test suites...\n");
console.log(`Total test suites: ${testSuites.length}\n`);

for (let i = 0; i < testSuites.length; i++) {
  const suite = testSuites[i];
  console.log(`\n${"=".repeat(70)}`);
  console.log(`[${i + 1}/${testSuites.length}] Running: ${suite.name}`);
  console.log("=".repeat(70));

  const suiteStartTime = Date.now();

  try {
    const output = execSync(suite.command, {
      encoding: "utf-8",
      stdio: "pipe",
      maxBuffer: 10 * 1024 * 1024,
      cwd: process.cwd(),
    });

    const suiteEndTime = Date.now();
    const duration = ((suiteEndTime - suiteStartTime) / 1000).toFixed(2);

    // Save output
    fs.writeFileSync(suite.outputFile, output, "utf8");

    // Determine if passed (look for success indicators)
    const hasPassed =
      !output.includes("FAILED") &&
      !output.includes("failed") &&
      (output.includes("PASSED") ||
        output.includes("passed") ||
        output.includes("✅"));

    results.push({
      feature: suite.name,
      passed: hasPassed,
      duration: `${duration}s`,
      output: output.substring(0, 2000), // First 2000 chars
      outputFile: suite.outputFile,
    });

    console.log(`✅ ${suite.name} completed in ${duration}s`);
  } catch (error) {
    const suiteEndTime = Date.now();
    const duration = ((suiteEndTime - suiteStartTime) / 1000).toFixed(2);

    const errorOutput = error.stdout || error.stderr || error.message;
    fs.writeFileSync(suite.outputFile, errorOutput, "utf8");

    results.push({
      feature: suite.name,
      passed: false,
      duration: `${duration}s`,
      error: error.message,
      output: errorOutput.substring(0, 2000),
      outputFile: suite.outputFile,
    });

    console.log(`❌ ${suite.name} failed after ${duration}s`);
  }
}

const endTime = Date.now();
const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

// Generate master report
const masterReport = generateDetailedReport(
  "Complete Test Suite - All Tests",
  results,
  passed,
  failed,
  {
    startTime,
    endTime,
    environment: {
      NODE_ENV: process.env.NODE_ENV || "not set",
      CI: process.env.CI || "false",
    },
    additionalInfo: {
      "Total Duration": `${totalDuration} seconds`,
      "Success Rate": `${((passed / results.length) * 100).toFixed(1)}%`,
    },
  }
);

console.log("\n" + "=".repeat(70));
console.log("📊 MASTER TEST SUMMARY");
console.log("=".repeat(70));
console.log(`Total Suites: ${results.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏱️  Total Duration: ${totalDuration}s`);
console.log(
  `📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`
);

console.log("\n" + "=".repeat(70));
console.log("📄 DETAILED MASTER REPORT");
console.log("=".repeat(70));
console.log(masterReport);

// Save master report
const reportSave = saveReportToFile(
  masterReport,
  "test-results-ALL-TESTS-detailed.txt"
);
if (reportSave.success) {
  console.log(`\n📝 Master detailed report saved to: ${reportSave.path}`);
}

// Save JSON summary
const jsonData = {
  timestamp: new Date().toISOString(),
  testName: "Complete Test Suite - All Tests",
  summary: {
    total: results.length,
    passed,
    failed,
    duration: `${totalDuration}s`,
    successRate: `${((passed / results.length) * 100).toFixed(1)}%`,
  },
  results,
  individualReports: results.map((r) => r.outputFile),
};

const jsonSave = saveJSONReport(jsonData, "test-results-ALL-TESTS.json");
if (jsonSave.success) {
  console.log(`📝 Master JSON report saved to: ${jsonSave.path}`);
}

console.log("\n" + "=".repeat(70));
console.log("📋 Individual Test Reports:");
results.forEach((r) => {
  console.log(`  ${r.passed ? "✅" : "❌"} ${r.feature}: ${r.outputFile}`);
});

console.log("\n" + "=".repeat(70));
console.log(`Test Run Completed: ${new Date().toISOString()}`);
console.log("=".repeat(70) + "\n");

process.exit(failed > 0 ? 1 : 0);
