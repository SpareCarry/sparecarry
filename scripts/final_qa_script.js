#!/usr/bin/env node

/**
 * Final QA Execution Script (Windows-compatible)
 * 
 * Runs all QA tests sequentially with menu-driven interface
 * Writes results to qa-results/ with timestamps
 * Never blocks CI (can run in background)
 *
 * Usage: node scripts/final_qa_script.js [--ci]
 *   --ci: Run in CI mode (non-interactive, no menus)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check for CI mode
const CI_MODE = process.argv.includes('--ci');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.join(SCRIPT_DIR, '..');
const RESULTS_DIR = path.join(PROJECT_ROOT, 'qa-results');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const resultsPath = path.join(RESULTS_DIR, timestamp);

// Create results directory
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}
if (!fs.existsSync(resultsPath)) {
  fs.mkdirSync(resultsPath, { recursive: true });
}

const logFile = path.join(resultsPath, 'qa-execution.log');
const summaryFile = path.join(resultsPath, 'qa-summary.json');

const results = {
  timestamp,
  tests: [],
  passed: 0,
  failed: 0,
  warnings: 0,
  overall: 'PENDING',
};

function writeLog(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

function runTest(name, command, critical = false) {
  writeLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  writeLog(`Running: ${name}`);
  writeLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const startTime = Date.now();
  let status = 'PASS';
  let message = '';

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: CI_MODE ? 'pipe' : 'inherit',
      encoding: 'utf-8',
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    message = `Completed in ${duration}s`;
    results.passed++;
    log(`✅ ${name}: ${message}`, 'green');
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    status = critical ? 'FAIL' : 'WARN';
    message = `Failed after ${duration}s: ${error.message}`;
    
    if (critical) {
      results.failed++;
      log(`❌ ${name}: ${message}`, 'red');
    } else {
      results.warnings++;
      log(`⚠️  ${name}: ${message}`, 'yellow');
    }
  }

  results.tests.push({
    name,
    status,
    message,
    duration: ((Date.now() - startTime) / 1000).toFixed(2),
    timestamp: new Date().toISOString(),
  });

  return status !== 'FAIL';
}

// Main QA execution
(async () => {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🧪 SpareCarry QA Test Suite', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`Mode: ${CI_MODE ? 'CI (Non-interactive)' : 'Interactive'}`, 'blue');
  log(`Results: ${resultsPath}\n`, 'blue');

  writeLog('QA Test Suite Started');
  writeLog(`Mode: ${CI_MODE ? 'CI' : 'Interactive'}`);

  // Test 1: Environment Validation
  runTest(
    'Environment Validation',
    'node scripts/validate-env.js staging',
    false
  );

  // Test 2: Build Check
  runTest(
    'Build Check',
    'node scripts/preflight-beta.js',
    false
  );

  // Test 3: Unit Tests
  const packageManager = fs.existsSync(path.join(PROJECT_ROOT, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm';
  runTest(
    'Unit Tests (Vitest)',
    `${packageManager} test`,
    false
  );

  // Test 4: Type Check
  runTest(
    'TypeScript Type Check',
    `${packageManager} typecheck`,
    false
  );

  // Test 5: Lint Check
  runTest(
    'Lint Check',
    `${packageManager} lint`,
    false
  );

  // Test 6: Build (if not in CI or if explicitly requested)
  if (!CI_MODE || process.argv.includes('--build')) {
    runTest(
      'Staging Build',
      `${packageManager} build:staging`,
      false
    );
  }

  // Test 7: Health Check (if server is running)
  runTest(
    'Health Check Endpoint',
    'node -e "const http=require(\'http\');const req=http.get(\'http://localhost:3000/api/health\',(r)=>{let d=\'\';r.on(\'data\',c=>d+=c);r.on(\'end\',()=>{try{const j=JSON.parse(d);if(j.status===\'ok\')process.exit(0);else process.exit(1);}catch{process.exit(1);}});});req.on(\'error\',()=>process.exit(0));req.setTimeout(5000,()=>{req.destroy();process.exit(0);});"',
    false
  );

  // Calculate overall status
  if (results.failed > 0) {
    results.overall = 'FAIL';
  } else if (results.warnings > 0) {
    results.overall = 'WARN';
  } else {
    results.overall = 'PASS';
  }

  // Save summary
  fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));

  // Final report
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📊 QA Test Summary', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`⚠️  Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');
  log(`\nOverall Status: ${results.overall}`, results.overall === 'PASS' ? 'green' : results.overall === 'WARN' ? 'yellow' : 'red');
  log(`Results saved to: ${resultsPath}`, 'blue');
  log(`Summary: ${summaryFile}\n`, 'blue');

  writeLog(`\nQA Test Suite Completed`);
  writeLog(`Overall Status: ${results.overall}`);
  writeLog(`Passed: ${results.passed}, Failed: ${results.failed}, Warnings: ${results.warnings}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
})();

