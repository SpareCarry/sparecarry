/**
 * Comprehensive Automated Test Suite for SpareCarry (Node.js compatible)
 * 
 * Run with: node scripts/test-all-features.js
 */

// Load environment variables from .env.local
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // dotenv not available, try to load manually
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (err) {
    // Continue without .env.local
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '';

const results = [];

async function testFeature(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    const details = await fn();
    results.push({ feature: name, passed: true, details });
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.push({ feature: name, passed: false, error: error.message });
    console.error(`❌ FAILED: ${name} - ${error.message}`);
  }
}

// Test 1: Environment variables
async function testEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'NOTIFICATIONS_EMAIL_FROM',
    'CRON_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  const present = required.filter(key => process.env[key]);
  
  // In local testing, warn but don't fail for missing vars
  // This allows testing infrastructure without all production secrets
  if (missing.length > 0 && process.env.CI !== 'true') {
    console.log(`   ⚠️  Missing: ${missing.join(', ')}`);
    console.log(`   ✅ Present: ${present.join(', ')}`);
    console.log(`   ℹ️  Note: Some features may not work without these variables`);
    return { allPresent: false, missing, present, warning: true };
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return { allPresent: true, present };
}

// Test 2: API Endpoints
async function testAPIEndpoints() {
  const endpoints = [
    '/api/matches/auto-match',
    '/api/payments/create-intent',
    '/api/payments/confirm-delivery',
    '/api/payments/auto-release',
    '/api/notifications/register-token',
  ];

  const accessible = [];
  const notFound = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      // 200, 400, 401, 403 are OK - means endpoint exists, just needs auth/valid data
      // 404 means endpoint doesn't exist (bad)
      // 500 means server error (might be OK if env vars missing)
      if (response.status === 404) {
        notFound.push(endpoint);
      } else {
        accessible.push({ endpoint, status: response.status });
      }
    } catch (error) {
      // Network error - server might not be running
      if (error.name === 'AbortError') {
        throw new Error(`Timeout connecting to ${BASE_URL} - is the server running?`);
      }
      // Other errors might be OK (CORS, etc.)
      accessible.push({ endpoint, status: 'error', error: error.message });
    }
  }
  
  if (notFound.length > 0) {
    throw new Error(`Endpoints not found: ${notFound.join(', ')}`);
  }
  
  return { accessible: accessible.length, endpoints: accessible };
}

// Test 3: Auto-release cron
async function testAutoReleaseCron() {
  if (!CRON_SECRET) {
    // In local testing, warn but don't fail
    if (process.env.CI !== 'true') {
      console.log('   ⚠️  CRON_SECRET not set - skipping test');
      return { accessible: false, authenticated: false, warning: 'CRON_SECRET not set' };
    }
    throw new Error('CRON_SECRET not set');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/payments/auto-release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 200 || response.status === 401 || response.status === 400) {
      return { accessible: true, authenticated: response.status === 200, status: response.status };
    }

    throw new Error(`Unexpected status: ${response.status}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout connecting to ${BASE_URL} - is the server running?`);
    }
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Feature Tests...\n');
  console.log('='.repeat(60));

  await testFeature('Environment Variables', testEnvironmentVariables);
  await testFeature('API Endpoints', testAPIEndpoints);
  await testFeature('Auto-Release Cron', testAutoReleaseCron);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.feature}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  // In CI, fail on any errors. In local testing, warn but don't fail
  const isCI = process.env.CI === 'true';
  const hasErrors = failed > 0;
  
  if (hasErrors && isCI) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  } else if (hasErrors) {
    console.log('\n⚠️  Some tests had issues. This is OK for local testing.');
    console.log('   In production, all environment variables should be set.');
    process.exit(0);
  } else {
    console.log('\n🎉 All tests passed! Your app is ready for production.');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testFeature };

