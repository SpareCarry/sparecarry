/**
 * Generate Test Coverage Report
 * 
 * Generates comprehensive test coverage report for beta review
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '../coverage');
const REPORT_DIR = path.join(__dirname, '../test-results/coverage-reports');

// Ensure directories exist
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log('📊 Generating Test Coverage Report...\n');

try {
  // Run coverage
  console.log('Running test coverage...');
  execSync('npm run coverage', { stdio: 'inherit' });

  // Check if coverage directory exists
  if (fs.existsSync(COVERAGE_DIR)) {
    console.log('\n✅ Coverage report generated');
    console.log(`📁 Coverage files: ${COVERAGE_DIR}`);
    
    // List coverage files
    const files = fs.readdirSync(COVERAGE_DIR);
    console.log('\nCoverage files:');
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('\n⚠️  Coverage directory not found');
  }

  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    coverageDir: COVERAGE_DIR,
    reportDir: REPORT_DIR,
    status: 'completed',
  };

  const summaryFile = path.join(REPORT_DIR, `coverage-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log(`\n📄 Summary saved to: ${summaryFile}`);
  console.log('\n✅ Coverage report generation complete');
} catch (error) {
  console.error('\n❌ Error generating coverage report:', error.message);
  process.exit(1);
}

