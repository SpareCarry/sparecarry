/**
 * Shared utilities for generating detailed test reports
 * Used by all test scripts
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a detailed test report
 */
function generateDetailedReport(testName, results, passed, failed, options = {}) {
  const timestamp = new Date().toISOString();
  const {
    startTime,
    endTime,
    environment = {},
    additionalInfo = {},
  } = options;

  const duration = startTime && endTime 
    ? ((endTime - startTime) / 1000).toFixed(2) + ' seconds'
    : 'N/A';

  let report = `\n${'='.repeat(70)}\n`;
  report += `  ${testName} - Detailed Test Report\n`;
  report += `${'='.repeat(70)}\n\n`;
  
  report += `METADATA\n`;
  report += `${'-'.repeat(70)}\n`;
  report += `Generated: ${timestamp}\n`;
  report += `Node Version: ${process.version}\n`;
  report += `Working Directory: ${process.cwd()}\n`;
  report += `Script Path: ${__filename}\n`;
  if (duration !== 'N/A') {
    report += `Duration: ${duration}\n`;
  }
  report += `\n`;
  
  report += `SUMMARY\n`;
  report += `${'-'.repeat(70)}\n`;
  report += `Total Tests: ${results.length}\n`;
  report += `Passed: ${passed}\n`;
  report += `Failed: ${failed}\n`;
  report += `Success Rate: ${results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0}%\n`;
  report += `\n`;
  
  report += `DETAILED RESULTS\n`;
  report += `${'-'.repeat(70)}\n\n`;
  
  results.forEach((result, index) => {
    report += `${index + 1}. ${result.feature || result.name || result.test || 'Unknown Test'}\n`;
    report += `   Status: ${result.passed !== false ? '✅ PASSED' : '❌ FAILED'}\n`;
    
    if (result.details) {
      report += `   Details:\n`;
      Object.entries(result.details).forEach(([key, value]) => {
        if (key !== 'allPresent' && key !== 'present' && key !== 'missing') {
          const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          // Indent multi-line values
          const lines = valueStr.split('\n');
          if (lines.length > 1) {
            report += `     ${key}:\n`;
            lines.forEach(line => {
              report += `       ${line}\n`;
            });
          } else {
            report += `     ${key}: ${valueStr}\n`;
          }
        }
      });
    }
    
    if (result.passed === false && result.error) {
      report += `   Error: ${result.error}\n`;
    }
    
    if (result.output) {
      report += `   Output:\n`;
      const outputLines = String(result.output).split('\n').slice(0, 20); // Limit to first 20 lines
      outputLines.forEach(line => {
        report += `     ${line}\n`;
      });
      if (String(result.output).split('\n').length > 20) {
        report += `     ... (truncated, see full output in JSON report)\n`;
      }
    }
    
    if (result.details?.warning) {
      report += `   ⚠️  Warning: ${result.details.warning}\n`;
    }
    
    if (result.details?.note) {
      report += `   ℹ️  Note: ${result.details.note}\n`;
    }
    
    report += `\n`;
  });
  
  // Environment information
  if (Object.keys(environment).length > 0 || Object.keys(additionalInfo).length > 0) {
    report += `\n${'-'.repeat(70)}\n`;
    report += `ENVIRONMENT INFORMATION\n`;
    report += `${'-'.repeat(70)}\n`;
    
    Object.entries(environment).forEach(([key, value]) => {
      report += `${key}: ${value}\n`;
    });
    
    if (Object.keys(additionalInfo).length > 0) {
      report += `\nAdditional Information:\n`;
      Object.entries(additionalInfo).forEach(([key, value]) => {
        report += `  ${key}: ${value}\n`;
      });
    }
  }
  
  report += `\n${'='.repeat(70)}\n`;
  
  return report;
}

/**
 * Save report to file
 */
function saveReportToFile(report, filename, outputDir = null) {
  const dir = outputDir || path.join(__dirname, '..');
  const filePath = path.join(dir, filename);
  
  try {
    fs.writeFileSync(filePath, report, 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Save JSON report for programmatic access
 */
function saveJSONReport(data, filename, outputDir = null) {
  const dir = outputDir || path.join(__dirname, '..');
  const filePath = path.join(dir, filename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Ensure output is not buffered (for redirected output)
 */
function setupUnbufferedOutput() {
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
  
  // When output is redirected, ensure we flush immediately
  if (process.stdout.isTTY === false) {
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = function(chunk, encoding, callback) {
      const result = originalWrite(chunk, encoding, callback);
      if (typeof chunk === 'string' && chunk.includes('\n')) {
        // Force flush on newlines
        if (process.stdout._flush) {
          process.stdout._flush();
        }
      }
      return result;
    };
  }
}

/**
 * Print startup banner
 */
function printStartupBanner(scriptName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${scriptName}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Test Run Started: ${new Date().toISOString()}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Script Path: ${__filename}`);
  console.log(`${'='.repeat(70)}\n`);
}

module.exports = {
  generateDetailedReport,
  saveReportToFile,
  saveJSONReport,
  setupUnbufferedOutput,
  printStartupBanner,
};

