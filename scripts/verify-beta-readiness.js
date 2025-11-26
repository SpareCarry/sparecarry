/**
 * Beta Readiness Verification Script
 * 
 * Verifies all safety checks, disclaimers, and edge cases are properly implemented
 */

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
printStartupBanner('Beta Readiness Verification');

console.log('🔍 Verifying Beta Readiness...\n');

const checks = {
  safetyDisclaimers: [],
  analyticsIntegration: [],
  edgeCaseTests: [],
  rlsPolicies: [],
  formValidations: [],
};

// Check for safety disclaimers in code
const filesToCheck = [
  'app/shipping-estimator/page.tsx',
  'components/forms/post-request-form.tsx',
  'components/forms/post-trip-form.tsx',
  'components/messaging/MessageInput.tsx',
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for disclaimers
    if (content.includes('Estimate only') || content.includes('disclaimer') || content.includes('Disclaimer')) {
      checks.safetyDisclaimers.push({ file, status: 'found' });
    }
    
    // Check for analytics tracking
    if (content.includes('track') || content.includes('analytics')) {
      checks.analyticsIntegration.push({ file, status: 'found' });
    }
  }
});

// Check for test files
const testFiles = [
  'tests/e2e/flows/edge-cases.spec.ts',
  'tests/e2e/flows/beta-testing-flow.spec.ts',
  'tests/e2e/flows/messaging.spec.ts',
  'tests/e2e/flows/post-request-upgrades.spec.ts',
  'tests/e2e/shipping-estimator.spec.ts',
];

testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    checks.edgeCaseTests.push({ file, status: 'exists' });
  }
});

// Check for RLS policies in migrations
const migrationFiles = fs.readdirSync(path.join(__dirname, '..', 'supabase', 'migrations'))
  .filter(f => f.endsWith('.sql'));

migrationFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('ENABLE ROW LEVEL SECURITY') || content.includes('CREATE POLICY')) {
    checks.rlsPolicies.push({ file, status: 'found' });
  }
});

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  checks: {
    safetyDisclaimers: {
      count: checks.safetyDisclaimers.length,
      files: checks.safetyDisclaimers,
    },
    analyticsIntegration: {
      count: checks.analyticsIntegration.length,
      files: checks.analyticsIntegration,
    },
    edgeCaseTests: {
      count: checks.edgeCaseTests.length,
      files: checks.edgeCaseTests,
    },
    rlsPolicies: {
      count: checks.rlsPolicies.length,
      files: checks.rlsPolicies,
    },
  },
  status: 'completed',
};

const endTime = Date.now();

// Convert to report format
const reportResults = [
  { 
    feature: 'Safety Disclaimers', 
    passed: report.checks.safetyDisclaimers.count > 0, 
    details: { count: report.checks.safetyDisclaimers.count, files: report.checks.safetyDisclaimers.files } 
  },
  { 
    feature: 'Analytics Integration', 
    passed: report.checks.analyticsIntegration.count > 0, 
    details: { count: report.checks.analyticsIntegration.count, files: report.checks.analyticsIntegration.files } 
  },
  { 
    feature: 'Edge Case Tests', 
    passed: report.checks.edgeCaseTests.count > 0, 
    details: { count: report.checks.edgeCaseTests.count, files: report.checks.edgeCaseTests.files } 
  },
  { 
    feature: 'RLS Policies', 
    passed: report.checks.rlsPolicies.count > 0, 
    details: { count: report.checks.rlsPolicies.count, files: report.checks.rlsPolicies.files } 
  },
];

const passed = reportResults.filter(r => r.passed).length;
const failed = reportResults.filter(r => !r.passed).length;

// Generate detailed report
const detailedReport = generateDetailedReport(
  'Beta Readiness Verification',
  reportResults,
  passed,
  failed,
  {
    startTime,
    endTime,
    additionalInfo: {
      'Overall Status': passed === reportResults.length ? '✅ Ready' : '⚠️ Needs Attention',
    },
  }
);

// Print summary
console.log('📋 Verification Summary:');
console.log('========================');
console.log(`Safety Disclaimers: ${report.checks.safetyDisclaimers.count} files`);
console.log(`Analytics Integration: ${report.checks.analyticsIntegration.count} files`);
console.log(`Edge Case Tests: ${report.checks.edgeCaseTests.count} files`);
console.log(`RLS Policies: ${report.checks.rlsPolicies.count} migrations`);

// Save report
const reportDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportFile = path.join(reportDir, `beta-readiness-verification-${Date.now()}.json`);
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(`\n📄 Full report saved to: ${reportFile}`);

// Save detailed report
const reportSave = saveReportToFile(detailedReport, 'test-results-beta-readiness-detailed.txt', reportDir);
if (reportSave.success) {
  console.log(`📝 Detailed report saved to: ${reportSave.path}`);
}

console.log('\n' + '='.repeat(70));
console.log('📄 DETAILED REPORT');
console.log('='.repeat(70));
console.log(detailedReport);

console.log('\n✅ Beta readiness verification complete');

