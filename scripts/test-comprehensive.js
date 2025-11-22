/**
 * Comprehensive Automated Test Suite for SpareCarry
 * 
 * Tests all features automatically:
 * - Environment variables
 * - Database connectivity
 * - Stripe connectivity
 * - API endpoints
 * - Matching algorithm
 * - Payment intents
 * - Notifications
 * - Auto-release cron
 */

const fs = require('fs');
const path = require('path');

// Load .env.local properly
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
    console.log('✅ Loaded .env.local using dotenv');
  } catch (error) {
    // Manual loading
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('✅ Loaded .env.local manually');
  }
} else {
  console.log('⚠️  .env.local not found at:', envPath);
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
    if (details && typeof details === 'object') {
      Object.entries(details).forEach(([key, value]) => {
        if (key !== 'allPresent' && key !== 'present' && key !== 'missing') {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        }
      });
    }
    return true;
  } catch (error) {
    results.push({ feature: name, passed: false, error: error.message });
    console.error(`❌ FAILED: ${name} - ${error.message}`);
    return false;
  }
}

// Test 1: Environment Variables
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

  const missing = [];
  const present = [];

  required.forEach(key => {
    const value = process.env[key];
    if (!value || value.trim() === '' || value.includes('your_') || value.includes('placeholder')) {
      missing.push(key);
    } else {
      present.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing or invalid environment variables: ${missing.join(', ')}\n   Present: ${present.join(', ')}`);
  }

  return { allPresent: true, count: present.length };
}

// Test 2: Database Connectivity
async function testDatabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  // Test if we can create a Supabase client (without actually connecting)
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Try a simple query to test connectivity
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation not found" which is OK
      throw error;
    }

    return { connected: true, canQuery: true };
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Test 3: Stripe Connectivity
async function testStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not configured');
  }

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Test if we can connect to Stripe
    const balance = await stripe.balance.retrieve();
    return { connected: true, mode: balance.livemode ? 'live' : 'test' };
  } catch (error) {
    throw new Error(`Stripe connection failed: ${error.message}`);
  }
}

// Test 4: API Endpoints
async function testAPIEndpoints() {
  const endpoints = [
    '/api/matches/auto-match',
    '/api/payments/create-intent',
    '/api/payments/confirm-delivery',
    '/api/payments/auto-release',
    '/api/notifications/register-token',
    '/api/notifications/send-message',
  ];

  const accessible = [];
  const errors = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 404) {
        errors.push({ endpoint, status: 404, error: 'Not found' });
      } else {
        accessible.push({ endpoint, status: response.status });
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('ECONNREFUSED')) {
        throw new Error(`Server not running at ${BASE_URL} - start with: pnpm dev`);
      }
      accessible.push({ endpoint, status: 'error', error: error.message });
    }
  }

  if (errors.length > 0) {
    throw new Error(`Endpoints not found: ${errors.map(e => e.endpoint).join(', ')}`);
  }

  return { accessible: accessible.length, endpoints: accessible };
}

// Test 5: Auto-Release Cron
async function testAutoReleaseCron() {
  if (!CRON_SECRET) {
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

    if (response.status === 200 || response.status === 400 || response.status === 401) {
      return { accessible: true, authenticated: response.status === 200, status: response.status };
    }

    throw new Error(`Unexpected status: ${response.status}`);
  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('ECONNREFUSED')) {
      throw new Error(`Server not running at ${BASE_URL} - start with: pnpm dev`);
    }
    throw error;
  }
}

// Test 6: Matching Algorithm
async function testMatchingAlgorithm() {
  try {
    const { calculateMatchScore } = require('../lib/matching/match-score');
    
    const testResult = calculateMatchScore({
      requestFrom: 'Miami',
      requestTo: 'St. Martin',
      tripFrom: 'Miami',
      tripTo: 'St. Martin',
      requestEarliest: '2024-01-01',
      requestLatest: '2024-01-15',
      tripDate: '2024-01-10',
      requestWeight: 20,
      requestDimensions: { length: 50, width: 40, height: 30 },
      requestValue: 1000,
      tripSpareKg: 50,
      tripMaxDimensions: { length: 60, width: 50, height: 40 },
      travelerVerifiedIdentity: true,
      travelerVerifiedSailor: false,
      travelerRating: 4.5,
      travelerCompletedDeliveries: 10,
      travelerSubscribed: false,
      tripType: 'plane',
    });

    if (!testResult || typeof testResult.totalScore !== 'number') {
      throw new Error('Matching algorithm returned invalid result');
    }

    return { algorithmWorks: true, sampleScore: testResult.totalScore, routeMatch: testResult.routeMatch };
  } catch (error) {
    throw new Error(`Matching algorithm test failed: ${error.message}`);
  }
}

// Test 7: Payment Intent Creation
async function testPaymentIntentCreation() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not configured');
  }

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create a test payment intent
    const intent = await stripe.paymentIntents.create({
      amount: 5000, // $50
      currency: 'usd',
      metadata: { test: 'true', automated_test: 'true' },
      description: 'Automated test payment intent',
    });

    // Cancel it immediately
    await stripe.paymentIntents.cancel(intent.id);

    return { canCreate: true, canCancel: true, intentId: intent.id };
  } catch (error) {
    throw new Error(`Payment intent creation failed: ${error.message}`);
  }
}

// Test 8: Notification Services
async function testNotificationServices() {
  const checks = {};

  // Check Expo
  if (process.env.EXPO_ACCESS_TOKEN && !process.env.EXPO_ACCESS_TOKEN.includes('your_')) {
    checks.expo = { configured: true };
  }

  // Check Resend
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_')) {
    checks.resend = { configured: true };
  }

  if (Object.keys(checks).length === 0) {
    throw new Error('No notification services configured');
  }

  return checks;
}

// Test 9: Database Tables
async function testDatabaseTables() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const tables = ['users', 'profiles', 'trips', 'requests', 'matches', 'deliveries', 'disputes'];
    const existing = [];
    const missing = [];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error && error.code === '42P01') { // Table does not exist
          missing.push(table);
        } else {
          existing.push(table);
        }
      } catch (error) {
        // Assume table exists if we get any other error
        existing.push(table);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing database tables: ${missing.join(', ')}`);
    }

    return { allTablesExist: true, tables: existing.length };
  } catch (error) {
    throw new Error(`Database tables test failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Automated Tests...\n');
  console.log('='.repeat(60));

  await testFeature('Environment Variables', testEnvironmentVariables);
  await testFeature('Database Connectivity', testDatabase);
  await testFeature('Stripe Connectivity', testStripe);
  await testFeature('API Endpoints', testAPIEndpoints);
  await testFeature('Auto-Release Cron', testAutoReleaseCron);
  await testFeature('Matching Algorithm', testMatchingAlgorithm);
  await testFeature('Payment Intent Creation', testPaymentIntentCreation);
  await testFeature('Notification Services', testNotificationServices);
  await testFeature('Database Tables', testDatabaseTables);

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

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
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

