/**
 * Run Vitest tests and generate detailed report
 * Usage: node scripts/run-vitest-with-report.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { 
  generateDetailedReport, 
  saveReportToFile, 
  saveJSONReport,
  setupUnbufferedOutput,
  printStartupBanner 
} = require('./test-report-utils');

const startTime = Date.now();
setupUnbufferedOutput();
printStartupBanner('Vitest Unit Tests');

const outputFile = 'test-results-vitest.txt';
const detailedReportFile = 'test-results-vitest-detailed.txt';
const jsonReportFile = 'test-results-vitest.json';

console.log('Running Vitest tests...\n');

try {
  // Run vitest and capture output
  const output = execSync('pnpm test', { 
    encoding: 'utf-8', 
    stdio: 'pipe',
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Save raw output
  fs.writeFileSync(outputFile, output, 'utf8');

  // Parse results (basic parsing - Vitest output format)
  const lines = output.split('\n');
  const testResults = [];
  let currentTest = null;
  let passed = 0;
  let failed = 0;

  lines.forEach(line => {
    // Look for test results
    if (line.includes('✓') || line.includes('PASS')) {
      passed++;
      const testName = line.replace(/[✓PASS]/g, '').trim();
      if (testName) {
        testResults.push({ feature: testName, passed: true });
      }
    } else if (line.includes('✗') || line.includes('FAIL')) {
      failed++;
      const testName = line.replace(/[✗FAIL]/g, '').trim();
      if (testName) {
        testResults.push({ feature: testName, passed: false, error: 'Test failed' });
      }
    }
  });

  // If we couldn't parse individual tests, create a summary
  if (testResults.length === 0) {
    const hasPassed = output.includes('Test Files') && !output.includes('failed');
    testResults.push({
      feature: 'All Unit Tests',
      passed: hasPassed,
      output: output.substring(0, 5000), // First 5000 chars
    });
    if (hasPassed) passed = 1;
    else failed = 1;
  }

  // Generate detailed report
  const report = generateDetailedReport(
    'Vitest Unit Tests',
    testResults,
    passed,
    failed,
    {
      startTime,
      endTime,
      environment: {
        'NODE_ENV': process.env.NODE_ENV || 'not set',
      },
    }
  );

  console.log('\n' + '='.repeat(70));
  console.log('📄 DETAILED REPORT');
  console.log('='.repeat(70));
  console.log(report);

  // Save reports
  const reportSave = saveReportToFile(report, detailedReportFile);
  if (reportSave.success) {
    console.log(`\n📝 Detailed report saved to: ${reportSave.path}`);
  }

  const jsonData = {
    timestamp: new Date().toISOString(),
    testName: 'Vitest Unit Tests',
    summary: { total: testResults.length, passed, failed, duration: `${duration}s` },
    results: testResults,
    rawOutput: output.substring(0, 10000), // First 10KB
  };
  const jsonSave = saveJSONReport(jsonData, jsonReportFile);
  if (jsonSave.success) {
    console.log(`📝 JSON report saved to: ${jsonSave.path}`);
  }

  console.log(`\n✅ Tests completed in ${duration} seconds`);
  console.log(`📄 Raw output saved to: ${outputFile}`);

  process.exit(failed > 0 ? 1 : 0);
} catch (error) {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.error('\n❌ Test execution failed');
  console.error('Error:', error.message);
  
  // Save error report
  const errorReport = {
    timestamp: new Date().toISOString(),
    testName: 'Vitest Unit Tests',
    status: 'failed',
    error: error.message,
    duration: `${duration}s`,
    output: error.stdout || error.stderr || 'No output captured',
  };

  const jsonSave = saveJSONReport(errorReport, jsonReportFile);
  if (jsonSave.success) {
    console.log(`📝 Error report saved to: ${jsonSave.path}`);
  }

  process.exit(1);
}

