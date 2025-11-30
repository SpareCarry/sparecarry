#!/usr/bin/env node
/**
 * Test Runner Script
 * Runs tests and captures output to file for debugging
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputFile = path.join(__dirname, "../test-output.txt");

console.log("Running tests...");
console.log("Output will be saved to:", outputFile);

try {
  const output = execSync("pnpm test 2>&1", {
    encoding: "utf8",
    cwd: path.join(__dirname, ".."),
    maxBuffer: 10 * 1024 * 1024, // 10MB
  });

  fs.writeFileSync(outputFile, output);
  console.log("\n=== Test Output ===");
  console.log(output);

  // Extract exit code from output (if any)
  const exitCode = output.includes("FAIL") || output.includes("Error") ? 1 : 0;
  process.exit(exitCode);
} catch (error) {
  const errorOutput =
    error.stdout?.toString() || error.stderr?.toString() || error.message;
  fs.writeFileSync(outputFile, errorOutput);
  console.error("\n=== Test Errors ===");
  console.error(errorOutput);
  process.exit(1);
}
