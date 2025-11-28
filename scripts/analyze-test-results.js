const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('test-results-playwright.json', 'utf8'));
  let passed = 0;
  let failed = 0;
  const failures = [];

  function countTests(suites) {
    suites.forEach(suite => {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            test.results.forEach(result => {
              if (result.status === 'passed') {
                passed++;
              } else if (result.status === 'failed') {
                failed++;
                failures.push({
                  file: suite.file,
                  title: spec.title,
                  error: result.error?.message || 'Unknown error'
                });
              }
            });
          });
        });
      }
      if (suite.suites) countTests(suite.suites);
    });
  }

  countTests(data.suites);

  console.log('\n=== Test Results Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log(`\nSuccess Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log(`\n=== Failed Tests (${failed}) ===`);
    failures.slice(0, 10).forEach((f, i) => {
      console.log(`${i + 1}. ${f.file}: ${f.title}`);
      console.log(`   Error: ${f.error.substring(0, 100)}...`);
    });
    if (failures.length > 10) {
      console.log(`\n... and ${failures.length - 10} more failures`);
    }
  }
} catch (error) {
  console.error('Error reading test results:', error.message);
  console.log('Run tests first to generate test-results-playwright.json');
}

