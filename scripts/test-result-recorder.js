/**
 * Test Result Recorder
 *
 * Records all test results in structured format (JSON and Markdown)
 * Tracks: errors, warnings, concerns, fixes applied, improvement suggestions
 */

const fs = require("fs");
const path = require("path");

const TEST_RESULTS_DIR = path.join(__dirname, "..", "test-results");
const HISTORY_DIR = path.join(__dirname, "..", "test-results", "history");
const REPORTS_DIR = path.join(__dirname, "..", "test-results", "reports");

// Ensure directories exist
[TEST_RESULTS_DIR, HISTORY_DIR, REPORTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generate timestamp string for filenames
 */
function getTimestamp() {
  return (
    new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
    "_" +
    new Date().toISOString().replace(/[:.]/g, "-").split("T")[1].split(".")[0]
  );
}

/**
 * Initialize result structure
 */
function initializeResult(iteration = 1) {
  return {
    timestamp: new Date().toISOString(),
    iteration,
    status: "in_progress",
    tests: {
      unit: { passed: 0, failed: 0, skipped: 0, errors: [] },
      integration: { passed: 0, failed: 0, skipped: 0, errors: [] },
      e2e: { passed: 0, failed: 0, skipped: 0, errors: [] },
    },
    staticAnalysis: {
      typescript: { errors: [], warnings: [] },
      linting: { errors: [], warnings: [] },
      typeCoverage: { percentage: 0, issues: [] },
    },
    configuration: {
      environment: { valid: false, missing: [], invalid: [] },
      apis: {
        supabase: { connected: false, errors: [] },
        stripe: { connected: false, errors: [] },
        resend: { connected: false, errors: [] },
      },
    },
    security: {
      vulnerabilities: [],
      issues: [],
    },
    performance: {
      buildTime: 0,
      bundleSize: 0,
      issues: [],
    },
    fixes: {
      applied: [],
      failed: [],
    },
    improvements: {
      missing: [],
      suggestions: [],
    },
    summary: {
      totalIssues: 0,
      totalFixes: 0,
      criticalErrors: 0,
      warnings: 0,
    },
  };
}

/**
 * Save result as JSON
 */
function saveJSON(result) {
  // Ensure directories exist before writing
  [TEST_RESULTS_DIR, HISTORY_DIR, REPORTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const timestamp = getTimestamp();
  const filename = `run-${timestamp}.json`;
  const filepath = path.join(TEST_RESULTS_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2), "utf8");

  // Also save to history
  const historyFilepath = path.join(HISTORY_DIR, filename);
  fs.writeFileSync(historyFilepath, JSON.stringify(result, null, 2), "utf8");

  return { filename, filepath };
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(result) {
  const timestamp = getTimestamp();
  const lines = [];

  lines.push("# Test Results Report");
  lines.push("");
  lines.push(`**Timestamp:** ${result.timestamp}`);
  lines.push(`**Iteration:** ${result.iteration}`);
  lines.push(`**Status:** ${result.status}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total Issues:** ${result.summary.totalIssues}`);
  lines.push(`- **Total Fixes Applied:** ${result.summary.totalFixes}`);
  lines.push(`- **Critical Errors:** ${result.summary.criticalErrors}`);
  lines.push(`- **Warnings:** ${result.summary.warnings}`);
  lines.push("");

  // Test Results
  lines.push("## Test Results");
  lines.push("");

  ["unit", "integration", "e2e"].forEach((testType) => {
    const test = result.tests[testType];
    lines.push(
      `### ${testType.charAt(0).toUpperCase() + testType.slice(1)} Tests`
    );
    lines.push("");
    lines.push(`- **Passed:** ${test.passed}`);
    lines.push(`- **Failed:** ${test.failed}`);
    lines.push(`- **Skipped:** ${test.skipped}`);

    if (test.errors.length > 0) {
      lines.push("");
      lines.push("**Errors:**");
      test.errors.forEach((error) => {
        lines.push(`- ${error}`);
      });
    }
    lines.push("");
  });

  // Static Analysis
  if (
    result.staticAnalysis.typescript.errors.length > 0 ||
    result.staticAnalysis.linting.errors.length > 0
  ) {
    lines.push("## Static Analysis");
    lines.push("");

    if (result.staticAnalysis.typescript.errors.length > 0) {
      lines.push("### TypeScript Errors");
      lines.push("");
      result.staticAnalysis.typescript.errors.forEach((error) => {
        lines.push(`- ${error}`);
      });
      lines.push("");
    }

    if (result.staticAnalysis.linting.errors.length > 0) {
      lines.push("### Linting Errors");
      lines.push("");
      result.staticAnalysis.linting.errors.forEach((error) => {
        lines.push(`- ${error}`);
      });
      lines.push("");
    }
  }

  // Configuration
  if (
    result.configuration.environment.missing.length > 0 ||
    result.configuration.environment.invalid.length > 0
  ) {
    lines.push("## Configuration Issues");
    lines.push("");

    if (result.configuration.environment.missing.length > 0) {
      lines.push("### Missing Environment Variables");
      lines.push("");
      result.configuration.environment.missing.forEach((varName) => {
        lines.push(`- \`${varName}\``);
      });
      lines.push("");
    }
  }

  // Security
  if (
    result.security.vulnerabilities.length > 0 ||
    result.security.issues.length > 0
  ) {
    lines.push("## Security Issues");
    lines.push("");
    [...result.security.vulnerabilities, ...result.security.issues].forEach(
      (issue) => {
        lines.push(`- ${issue}`);
      }
    );
    lines.push("");
  }

  // Fixes Applied
  if (result.fixes.applied.length > 0) {
    lines.push("## Fixes Applied");
    lines.push("");
    result.fixes.applied.forEach((fix) => {
      lines.push(`- ✅ ${fix}`);
    });
    lines.push("");
  }

  // Improvements
  if (
    result.improvements.missing.length > 0 ||
    result.improvements.suggestions.length > 0
  ) {
    lines.push("## Improvement Suggestions");
    lines.push("");

    if (result.improvements.missing.length > 0) {
      lines.push("### Missing Components");
      lines.push("");
      result.improvements.missing.forEach((item) => {
        lines.push(`- ${item}`);
      });
      lines.push("");
    }

    if (result.improvements.suggestions.length > 0) {
      lines.push("### Suggestions");
      lines.push("");
      result.improvements.suggestions.forEach((suggestion) => {
        lines.push(`- 💡 ${suggestion}`);
      });
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push(`*Report generated at ${result.timestamp}*`);

  return lines.join("\n");
}

/**
 * Save Markdown report
 */
function saveMarkdown(result) {
  const markdown = generateMarkdownReport(result);
  const timestamp = getTimestamp();
  const filename = `run-${timestamp}.md`;
  const filepath = path.join(REPORTS_DIR, filename);

  fs.writeFileSync(filepath, markdown, "utf8");

  return { filename, filepath };
}

/**
 * Calculate summary statistics
 */
function calculateSummary(result) {
  let totalIssues = 0;
  let criticalErrors = 0;
  let warnings = 0;

  // Count test failures
  totalIssues += result.tests.unit.failed;
  totalIssues += result.tests.integration.failed;
  totalIssues += result.tests.e2e.failed;

  // Count static analysis errors
  totalIssues += result.staticAnalysis.typescript.errors.length;
  totalIssues += result.staticAnalysis.linting.errors.length;

  // Count configuration issues
  totalIssues += result.configuration.environment.missing.length;
  totalIssues += result.configuration.environment.invalid.length;

  // Count security issues
  criticalErrors += result.security.vulnerabilities.length;
  warnings += result.security.issues.length;

  result.summary = {
    totalIssues,
    totalFixes: result.fixes.applied.length,
    criticalErrors,
    warnings,
  };

  return result;
}

/**
 * Save result (JSON and Markdown)
 */
function saveResult(result) {
  const resultWithSummary = calculateSummary(result);

  const jsonResult = saveJSON(resultWithSummary);
  const markdownResult = saveMarkdown(resultWithSummary);

  return {
    json: jsonResult,
    markdown: markdownResult,
    summary: resultWithSummary.summary,
  };
}

/**
 * Load previous result for comparison
 */
function loadPreviousResult() {
  const files = fs
    .readdirSync(TEST_RESULTS_DIR)
    .filter((f) => f.startsWith("run-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  try {
    const content = fs.readFileSync(
      path.join(TEST_RESULTS_DIR, files[0]),
      "utf8"
    );
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

module.exports = {
  initializeResult,
  saveResult,
  saveJSON,
  saveMarkdown,
  loadPreviousResult,
  calculateSummary,
  TEST_RESULTS_DIR,
  HISTORY_DIR,
  REPORTS_DIR,
};
