#!/usr/bin/env node

/**
 * Stable E2E Test Runner
 *
 * This script:
 * 1. Builds the application
 * 2. Starts the production server
 * 3. Waits for server to be ready
 * 4. Runs all Playwright tests
 * 5. Shuts down the server automatically
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const BASE_URL = "http://localhost:3000";
const SERVER_READY_TIMEOUT = 120000; // 2 minutes
const SERVER_CHECK_INTERVAL = 2000; // 2 seconds
const SERVER_START_TIMEOUT = 60000; // 1 minute

let serverProcess = null;

/**
 * Check if server is ready
 */
function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(
        res.statusCode === 200 ||
          res.statusCode === 307 ||
          res.statusCode === 308
      );
    });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer() {
  console.log("⏳ Waiting for server to be ready...");
  const startTime = Date.now();

  while (Date.now() - startTime < SERVER_READY_TIMEOUT) {
    const isReady = await checkServerReady();
    if (isReady) {
      console.log("✅ Server is ready!");
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, SERVER_CHECK_INTERVAL));
    process.stdout.write(".");
  }

  console.log("\n❌ Server did not become ready in time");
  return false;
}

/**
 * Build the application
 */
function buildApp() {
  console.log("📦 Building application...");
  try {
    execSync("pnpm build", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("✅ Build completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    return false;
  }
}

/**
 * Start the production server
 */
function startServer() {
  console.log("🚀 Starting production server...");
  serverProcess = spawn("pnpm", ["start"], {
    stdio: "pipe",
    cwd: process.cwd(),
    shell: true,
  });

  serverProcess.stdout.on("data", (data) => {
    const output = data.toString();
    // Log server output for debugging
    if (output.includes("Ready") || output.includes("started")) {
      console.log("📡 Server output:", output.trim());
    }
  });

  serverProcess.stderr.on("data", (data) => {
    console.error("⚠️  Server error:", data.toString().trim());
  });

  serverProcess.on("error", (error) => {
    console.error("❌ Failed to start server:", error);
  });

  return serverProcess;
}

/**
 * Stop the server
 */
function stopServer() {
  if (serverProcess) {
    console.log("🛑 Stopping server...");
    try {
      // Try graceful shutdown first
      serverProcess.kill("SIGTERM");

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill("SIGKILL");
        }
      }, 5000);
    } catch (error) {
      console.error("⚠️  Error stopping server:", error.message);
    }
  }
}

/**
 * Run Playwright tests
 */
function runTests() {
  console.log("🧪 Running Playwright tests...");
  try {
    execSync("npx playwright test", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("✅ All tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Tests failed:", error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🧪 Starting stable E2E test run...\n");

  try {
    // Step 1: Build the application
    if (!buildApp()) {
      process.exit(1);
    }

    // Step 2: Start the server
    startServer();

    // Step 3: Wait for server to be ready
    const serverReady = await waitForServer();
    if (!serverReady) {
      stopServer();
      process.exit(1);
    }

    // Small delay to ensure server is fully ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 4: Run tests
    const testsPassed = runTests();

    // Step 5: Stop server
    stopServer();

    // Exit with appropriate code
    process.exit(testsPassed ? 0 : 1);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    stopServer();
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n⚠️  Interrupted by user");
  stopServer();
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Terminated");
  stopServer();
  process.exit(1);
});

// Run main function
main();
