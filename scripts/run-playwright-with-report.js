/**
 * Run Playwright E2E tests and generate detailed report
 * Usage: node scripts/run-playwright-with-report.js
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
printStartupBanner("Playwright E2E Tests");

const outputFile = "test-results-playwright.txt";
const detailedReportFile = "test-results-playwright-detailed.txt";
const jsonReportFile = "test-results-playwright.json";

console.log("Running Playwright E2E tests...\n");

try {
  // Run playwright and capture output
  const output = execSync("pnpm test:e2e", {
    encoding: "utf-8",
    stdio: "pipe",
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Save raw output
  fs.writeFileSync(outputFile, output, "utf8");

  // Parse results (basic parsing - Playwright output format)
  const lines = output.split("\n");
  const testResults = [];
  let passed = 0;
  let failed = 0;

  lines.forEach((line) => {
    // Look for test results
    if (line.includes("✓") || line.includes("passed")) {
      passed++;
      const testName = line.replace(/[✓passed]/g, "").trim();
      if (testName && !testName.includes("Running")) {
        testResults.push({ feature: testName, passed: true });
      }
    } else if (line.includes("✗") || line.includes("failed")) {
      failed++;
      const testName = line.replace(/[✗failed]/g, "").trim();
      if (testName && !testName.includes("Running")) {
        testResults.push({
          feature: testName,
          passed: false,
          error: "Test failed",
        });
      }
    }
  });

  // If we couldn't parse individual tests, create a summary
  if (testResults.length === 0) {
    const hasPassed = output.includes("passed") && !output.includes("failed");
    testResults.push({
      feature: "All E2E Tests",
      passed: hasPassed,
      output: output.substring(0, 5000), // First 5000 chars
    });
    if (hasPassed) passed = 1;
    else failed = 1;
  }

  // Generate detailed report
  const report = generateDetailedReport(
    "Playwright E2E Tests",
    testResults,
    passed,
    failed,
    {
      startTime,
      endTime,
      environment: {
        NODE_ENV: process.env.NODE_ENV || "not set",
        PLAYWRIGHT_BROWSERS_PATH:
          process.env.PLAYWRIGHT_BROWSERS_PATH || "not set",
      },
    }
  );

  console.log("\n" + "=".repeat(70));
  console.log("📄 DETAILED REPORT");
  console.log("=".repeat(70));
  console.log(report);

  // Save reports
  const reportSave = saveReportToFile(report, detailedReportFile);
  if (reportSave.success) {
    console.log(`\n📝 Detailed report saved to: ${reportSave.path}`);
  }

  const jsonData = {
    timestamp: new Date().toISOString(),
    testName: "Playwright E2E Tests",
    summary: {
      total: testResults.length,
      passed,
      failed,
      duration: `${duration}s`,
    },
    results: testResults,
    rawOutput: output.substring(0, 10000), // First 10KB
  };
  const jsonSave = saveJSONReport(jsonData, jsonReportFile);
  if (jsonSave.success) {
    console.log(`📝 JSON report saved to: ${jsonSave.path}`);
  }

  console.log(`\n✅ Tests completed in ${duration} seconds`);
  console.log(`📄 Raw output saved to: ${outputFile}`);

  // Check for Playwright HTML report
  const htmlReportPath = path.join(
    __dirname,
    "..",
    "playwright-report",
    "index.html"
  );
  if (fs.existsSync(htmlReportPath)) {
    console.log(`📊 HTML report available at: ${htmlReportPath}`);
  }

  process.exit(failed > 0 ? 1 : 0);
} catch (error) {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.error("\n❌ Test execution failed");
  console.error("Error:", error.message);

  // Save error report
  const errorReport = {
    timestamp: new Date().toISOString(),
    testName: "Playwright E2E Tests",
    status: "failed",
    error: error.message,
    duration: `${duration}s`,
    output: error.stdout || error.stderr || "No output captured",
  };

  const jsonSave = saveJSONReport(errorReport, jsonReportFile);
  if (jsonSave.success) {
    console.log(`📝 Error report saved to: ${jsonSave.path}`);
  }

  process.exit(1);
}
