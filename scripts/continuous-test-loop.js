#!/usr/bin/env node

/**
 * Continuous Test Loop Controller
 *
 * Main entry point that:
 * - Runs comprehensive test suite
 * - Records results
 * - Applies auto-fixes
 * - Re-runs tests
 * - Continues until all issues resolved or max iterations reached
 * - Generates final summary report
 *
 * OPTIMIZED: Always uses mocks to avoid hitting service limits
 */

// FORCE MOCK MODE - Never make real API calls during testing
// This prevents hitting Supabase free plan limits and other service quotas
process.env.USE_TEST_MOCKS = "true";
process.env.AVOID_EXTERNAL_CALLS = "true";
process.env.SUPABASE_MOCK_MODE = "true";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { runComprehensiveTests } = require("./comprehensive-test-runner");
const { applyAutoFixes } = require("./auto-fix-issues");
const { loadPreviousResult } = require("./test-result-recorder");
const fs = require("fs");
const path = require("path");

// Load test configuration
const configPath = path.join(__dirname, "..", "test-config.json");
let testConfig = {
  maxIterations: 10,
  autoFix: { enabled: true },
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
 * Check if we should continue testing
 */
function shouldContinue(iteration, lastResult, fixesApplied) {
  if (iteration >= testConfig.maxIterations) {
    return { continue: false, reason: "Max iterations reached" };
  }

  if (!lastResult.hasErrors) {
    return { continue: false, reason: "All tests passed" };
  }

  if (!fixesApplied && iteration > 1) {
    return {
      continue: false,
      reason: "No fixes were applied in last iteration",
    };
  }

  return { continue: true };
}

/**
 * Generate final summary
 */
function generateSummary(allResults) {
  const totalIterations = allResults.length;
  const successfulRuns = allResults.filter((r) => r && !r.hasErrors).length;
  const finalResult = allResults[allResults.length - 1];

  // Handle case where finalResult might be undefined due to error
  if (!finalResult) {
    return {
      totalIterations,
      successfulRuns,
      finalStatus: "ERROR",
      totalFixesApplied: allResults.reduce(
        (sum, r) => sum + (r?.fixesApplied || 0),
        0
      ),
      remainingIssues: 0,
      error: "No final result available",
    };
  }

  const summary = {
    totalIterations,
    successfulRuns,
    finalStatus: finalResult.hasErrors ? "FAILURE" : "SUCCESS",
    totalFixesApplied: allResults.reduce(
      (sum, r) => sum + (r?.fixesApplied || 0),
      0
    ),
    remainingIssues: finalResult.hasErrors
      ? finalResult.result?.summary?.totalIssues || 0
      : 0,
  };

  return summary;
}

/**
 * Print summary to console
 */
function printSummary(summary, allResults) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(60) + "\n");

  console.log(`Total Iterations: ${summary.totalIterations}`);
  console.log(`Successful Runs: ${summary.successfulRuns}`);
  console.log(
    `Final Status: ${summary.finalStatus === "SUCCESS" ? "✅ SUCCESS" : "❌ FAILURE"}`
  );
  console.log(`Total Fixes Applied: ${summary.totalFixesApplied}`);
  console.log(`Remaining Issues: ${summary.remainingIssues}`);

  if (summary.remainingIssues > 0) {
    console.log("\n⚠️  Some issues remain that require manual attention:");
    const finalResult = allResults[allResults.length - 1].result;

    if (
      finalResult.tests.unit.failed > 0 ||
      finalResult.tests.integration.failed > 0 ||
      finalResult.tests.e2e.failed > 0
    ) {
      console.log(
        `  - Test failures: ${finalResult.tests.unit.failed + finalResult.tests.integration.failed + finalResult.tests.e2e.failed}`
      );
    }

    if (finalResult.staticAnalysis.typescript.errors.length > 0) {
      console.log(
        `  - TypeScript errors: ${finalResult.staticAnalysis.typescript.errors.length}`
      );
    }

    if (finalResult.staticAnalysis.linting.errors.length > 0) {
      console.log(
        `  - Linting errors: ${finalResult.staticAnalysis.linting.errors.length}`
      );
    }

    if (finalResult.configuration.environment.missing.length > 0) {
      console.log(
        `  - Missing environment variables: ${finalResult.configuration.environment.missing.length}`
      );
    }

    if (finalResult.security.vulnerabilities.length > 0) {
      console.log(
        `  - Security vulnerabilities: ${finalResult.security.vulnerabilities.length}`
      );
    }

    console.log("\n📝 See detailed reports in test-results/reports/ directory");
  } else {
    console.log("\n🎉 All tests passed! App is ready for production.");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Main continuous loop
 */
async function runContinuousLoop() {
  console.log("🚀 Starting Continuous Test Loop\n");
  console.log(`Max Iterations: ${testConfig.maxIterations}`);
  console.log(
    `Auto-Fix: ${testConfig.autoFix?.enabled ? "Enabled" : "Disabled"}`
  );
  console.log("Press Ctrl+C to stop\n");

  const allResults = [];
  let iteration = 1;

  while (iteration <= testConfig.maxIterations) {
    try {
      // Run comprehensive tests
      const testResult = await runComprehensiveTests(iteration);
      allResults.push(testResult);

      // Check if we should continue
      const previousResult = iteration > 1 ? allResults[iteration - 2] : null;
      const fixesApplied = previousResult?.fixesApplied || 0;

      const shouldContinueCheck = shouldContinue(
        iteration,
        testResult,
        fixesApplied > 0
      );

      if (!shouldContinueCheck.continue) {
        console.log(`\n🛑 Stopping: ${shouldContinueCheck.reason}\n`);
        break;
      }

      // Apply auto-fixes if enabled and there are errors
      if (testConfig.autoFix?.enabled && testResult.hasErrors) {
        console.log("\n🔧 Applying auto-fixes...\n");

        try {
          const fixResult = await applyAutoFixes(
            testResult.result.staticAnalysis
          );

          if (fixResult.applied.length > 0) {
            console.log(`✅ Applied ${fixResult.applied.length} fixes:`);
            fixResult.applied.forEach((fix) => console.log(`   - ${fix}`));
            testResult.fixesApplied = fixResult.applied.length;
          }

          if (fixResult.failed.length > 0) {
            console.log(`❌ Failed to apply ${fixResult.failed.length} fixes:`);
            fixResult.failed.forEach((fix) => console.log(`   - ${fix}`));
          }

          if (fixResult.applied.length === 0 && fixResult.failed.length === 0) {
            console.log("ℹ️  No auto-fixable issues found");
          }
        } catch (error) {
          console.error(`❌ Error applying fixes: ${error.message}`);
        }

        // Small delay before next iteration
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else if (testResult.hasErrors) {
        console.log("\n⚠️  Errors found but auto-fix is disabled");
      }

      iteration++;
    } catch (error) {
      console.error(`\n❌ Error in iteration ${iteration}: ${error.message}`);
      console.error(error.stack);

      // Add error result to maintain structure
      allResults.push({
        iteration,
        hasErrors: true,
        error: error.message,
        fixesApplied: 0,
        result: {
          summary: {
            totalIssues: 1,
            errors: [error.message],
          },
        },
      });

      // If this is the first iteration and it failed, we should still try to generate summary
      if (iteration === 1) {
        break;
      }

      // Continue to next iteration if we have results, otherwise break
      if (allResults.length === 0) {
        break;
      }

      iteration++;
    }
  }

  // Generate and print final summary
  if (allResults.length === 0) {
    console.error("\n❌ No test results available. Cannot generate summary.\n");
    process.exit(1);
  }

  const summary = generateSummary(allResults);
  printSummary(summary, allResults);

  // Ensure test-results directory exists before saving
  const testResultsDir = path.join(__dirname, "..", "test-results");
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Save summary to file
  const summaryPath = path.join(testResultsDir, `summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`📄 Summary saved to: ${summaryPath}\n`);

  // Exit with appropriate code
  process.exit(summary.finalStatus === "SUCCESS" ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runContinuousLoop().catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = {
  runContinuousLoop,
  shouldContinue,
  generateSummary,
};
