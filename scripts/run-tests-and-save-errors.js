/**
 * Run all E2E tests and save errors to a file for analysis
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputFile = path.join(__dirname, "..", "test-errors-detailed.txt");
const jsonFile = path.join(__dirname, "..", "test-errors-detailed.json");

console.log("Running all E2E tests...\n");

try {
  const output = execSync(
    "npx playwright test --reporter=list --project=chromium",
    {
      encoding: "utf-8",
      stdio: "pipe",
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      cwd: path.join(__dirname, ".."),
    }
  );

  // Save raw output
  fs.writeFileSync(outputFile, output, "utf8");

  // Parse results
  const lines = output.split("\n");
  const errors = [];
  let currentError = null;
  let inError = false;

  lines.forEach((line, index) => {
    if (line.includes("failed") || line.includes("Error:")) {
      inError = true;
      if (currentError) {
        errors.push(currentError);
      }
      currentError = {
        line: index + 1,
        error: line,
        details: [],
      };
    } else if (inError && line.trim()) {
      if (currentError) {
        currentError.details.push(line);
      }
    }
    if (line.includes("passed") && !line.includes("failed")) {
      inError = false;
      if (currentError) {
        errors.push(currentError);
        currentError = null;
      }
    }
  });

  if (currentError) {
    errors.push(currentError);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    errors: errors,
    rawOutput: output.substring(0, 50000), // First 50KB
  };

  fs.writeFileSync(jsonFile, JSON.stringify(summary, null, 2), "utf8");

  console.log(`\n✅ Test run complete`);
  console.log(`📄 Errors saved to: ${outputFile}`);
  console.log(`📄 JSON saved to: ${jsonFile}`);
  console.log(`\nTotal errors found: ${errors.length}`);
} catch (error) {
  const errorOutput = error.stdout || error.stderr || error.message;
  fs.writeFileSync(outputFile, errorOutput, "utf8");

  const errorSummary = {
    timestamp: new Date().toISOString(),
    status: "failed",
    error: error.message,
    output: errorOutput.substring(0, 50000),
  };

  fs.writeFileSync(jsonFile, JSON.stringify(errorSummary, null, 2), "utf8");

  console.error("\n❌ Test execution failed");
  console.error("Error:", error.message);
  console.log(`📄 Error output saved to: ${outputFile}`);
}
