#!/usr/bin/env node
/**
 * Preflight Check Script
 * 
 * Validates environment, dependencies, and configuration before deployment
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let errors = [];
let warnings = [];
let passed = [];

function check(name, condition, errorMsg, warningMsg) {
  if (condition) {
    passed.push(name);
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else if (errorMsg) {
    errors.push({ name, message: errorMsg });
    console.log(`${colors.red}✗${colors.reset} ${name}: ${errorMsg}`);
  } else if (warningMsg) {
    warnings.push({ name, message: warningMsg });
    console.log(`${colors.yellow}⚠${colors.reset} ${name}: ${warningMsg}`);
  }
}

console.log(`${colors.blue}🔍 SpareCarry Preflight Check${colors.reset}\n`);

// 1. Check package.json exists
check('package.json exists', fs.existsSync('package.json'));

// 2. Check node_modules
check('node_modules exists', fs.existsSync('node_modules'), 'Run: pnpm install');

// 3. Check critical dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

check('Next.js installed', deps.next, 'Install: pnpm add next');
check('React installed', deps.react, 'Install: pnpm add react react-dom');
check('Supabase installed', deps['@supabase/supabase-js'], 'Install: pnpm add @supabase/supabase-js');
check('Stripe installed', deps.stripe, 'Install: pnpm add stripe');
check('Tailwind installed', deps.tailwindcss, 'Install: pnpm add -D tailwindcss');
check('Vitest installed', deps.vitest, 'Install: pnpm add -D vitest');
check('Playwright installed', deps['@playwright/test'], 'Install: pnpm add -D @playwright/test');
check('Capacitor installed', deps['@capacitor/core'], 'Install: pnpm add @capacitor/core');

// 4. Check configuration files
check('next.config.js exists', fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs'));
check('tailwind.config.js exists', fs.existsSync('tailwind.config.js') || fs.existsSync('tailwind.config.ts'));
check('tsconfig.json exists', fs.existsSync('tsconfig.json'));
check('vitest.config.ts exists', fs.existsSync('vitest.config.ts'));
check('playwright.config.ts exists', fs.existsSync('playwright.config.ts'));

// 5. Check environment file template
check('.env.local.example exists', fs.existsSync('.env.local.example'), 'Create .env.local.example');

// 6. Check critical directories
check('app/ directory exists', fs.existsSync('app'));
check('components/ directory exists', fs.existsSync('components'));
check('lib/ directory exists', fs.existsSync('lib'));
check('tests/ directory exists', fs.existsSync('tests'));

// 7. Check critical files
check('app/layout.tsx exists', fs.existsSync('app/layout.tsx'));
check('app/providers.tsx exists', fs.existsSync('app/providers.tsx'));
check('lib/logger/index.ts exists', fs.existsSync('lib/logger/index.ts'));
check('lib/supabase/client.ts exists', fs.existsSync('lib/supabase/client.ts'));
check('lib/supabase/server.ts exists', fs.existsSync('lib/supabase/server.ts'));

// 8. Check security files
check('lib/security/rate-limit.ts exists', fs.existsSync('lib/security/rate-limit.ts'));
check('lib/security/auth-guards.ts exists', fs.existsSync('lib/security/auth-guards.ts'));
check('lib/security/validation.ts exists', fs.existsSync('lib/security/validation.ts'));
check('lib/api/error-handler.ts exists', fs.existsSync('lib/api/error-handler.ts'));

// 9. Check mobile files
check('capacitor.config.ts exists', fs.existsSync('capacitor.config.ts'));
check('ios/fastlane/Fastfile exists', fs.existsSync('ios/fastlane/Fastfile'));
check('android/fastlane/Fastfile exists', fs.existsSync('android/fastlane/Fastfile'));

// 10. Check backup scripts
check('scripts/backup/backup_db.sh exists', fs.existsSync('scripts/backup/backup_db.sh'));
check('scripts/backup/restore_db.sh exists', fs.existsSync('scripts/backup/restore_db.sh'));

// 11. Check load testing
check('load-tests/scripts/browse.js exists', fs.existsSync('load-tests/scripts/browse.js'));

// 12. Check feature flags
check('lib/flags/unleashClient.ts exists', fs.existsSync('lib/flags/unleashClient.ts'));
check('app/providers/FeatureFlagProvider.tsx exists', fs.existsSync('app/providers/FeatureFlagProvider.tsx'));

// 13. Check performance instrumentation
check('lib/performance/web-profiler.ts exists', fs.existsSync('lib/performance/web-profiler.ts'));
check('lib/performance/db-profiler.ts exists', fs.existsSync('lib/performance/db-profiler.ts'));

// 14. Check CI workflows
check('.github/workflows/ci.yml exists', fs.existsSync('.github/workflows/ci.yml'));
check('.github/workflows/mobile-deploy.yml exists', fs.existsSync('.github/workflows/mobile-deploy.yml'));
check('.github/workflows/nightly-backup.yml exists', fs.existsSync('.github/workflows/nightly-backup.yml'));
check('.github/workflows/loadtest.yml exists', fs.existsSync('.github/workflows/loadtest.yml'));

// 15. Check documentation
check('ERROR_LOGGING_SYSTEM.md exists', fs.existsSync('ERROR_LOGGING_SYSTEM.md'));
check('MOBILE_DEPLOYMENT_AUTOMATION.md exists', fs.existsSync('MOBILE_DEPLOYMENT_AUTOMATION.md'));
check('BACKUP_RECOVERY_PLAYBOOK.md exists', fs.existsSync('BACKUP_RECOVERY_PLAYBOOK.md'));
check('FEATURE_FLAGS_README.md exists', fs.existsSync('FEATURE_FLAGS_README.md'));
check('LOADTEST_REPORT.md exists', fs.existsSync('LOADTEST_REPORT.md'));

// 16. Check build output (if exists)
if (fs.existsSync('out')) {
  check('out/ directory exists', true);
  const outFiles = fs.readdirSync('out');
  check('out/ has files', outFiles.length > 0, 'Run: pnpm build');
} else {
  check('out/ directory exists', false, null, 'Run: pnpm build to create out/');
}

// Summary
console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}Summary${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}Passed: ${passed.length}${colors.reset}`);
console.log(`${colors.yellow}Warnings: ${warnings.length}${colors.reset}`);
console.log(`${colors.red}Errors: ${errors.length}${colors.reset}\n`);

if (warnings.length > 0) {
  console.log(`${colors.yellow}Warnings:${colors.reset}`);
  warnings.forEach(w => console.log(`  - ${w.name}: ${w.message}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`${colors.red}Errors (must fix):${colors.reset}`);
  errors.forEach(e => console.log(`  - ${e.name}: ${e.message}`));
  console.log('');
  process.exit(1);
}

console.log(`${colors.green}✅ Preflight check passed!${colors.reset}\n`);
process.exit(0);

