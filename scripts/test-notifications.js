#!/usr/bin/env node

/**
 * Test script for notification endpoints
 * 
 * Usage:
 *   node scripts/test-notifications.js --type=push --recipientId=user-id
 *   node scripts/test-notifications.js --type=email --recipientId=user-id
 *   node scripts/test-notifications.js --type=both --recipientId=user-id
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_APP_URL (default: http://localhost:3000)
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 *   - EXPO_ACCESS_TOKEN (for push tests)
 *   - RESEND_API_KEY (for email tests)
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_TYPE = args.type || 'both';
const RECIPIENT_ID = args.recipientId;
const MATCH_ID = args.matchId || `test-match-${Date.now()}`;

if (!RECIPIENT_ID) {
  console.error('❌ Error: recipientId is required');
  console.log('Usage: node scripts/test-notifications.js --type=push --recipientId=user-id');
  process.exit(1);
}

async function testNotification(type) {
  const endpoint = type === 'push' || type === 'email' 
    ? '/api/notifications/send-message'
    : '/api/notifications/send-message';
  
  const url = new URL(`${APP_URL}${endpoint}`);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  
  const payload = {
    matchId: MATCH_ID,
    recipientId: RECIPIENT_ID,
    senderName: 'Test User',
    messagePreview: `This is a test ${type} notification`,
  };

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function checkEnvVars() {
  const missing = [];
  
  if (TEST_TYPE === 'push' || TEST_TYPE === 'both') {
    if (!process.env.EXPO_ACCESS_TOKEN) {
      missing.push('EXPO_ACCESS_TOKEN');
    }
  }
  
  if (TEST_TYPE === 'email' || TEST_TYPE === 'both') {
    if (!process.env.RESEND_API_KEY) {
      missing.push('RESEND_API_KEY');
    }
  }
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    console.log('Please set them in your .env.local file or environment');
    process.exit(1);
  }
}

async function main() {
  console.log('🧪 Testing Notifications\n');
  console.log(`Type: ${TEST_TYPE}`);
  console.log(`Recipient ID: ${RECIPIENT_ID}`);
  console.log(`Match ID: ${MATCH_ID}`);
  console.log(`App URL: ${APP_URL}\n`);

  await checkEnvVars();

  try {
    if (TEST_TYPE === 'push' || TEST_TYPE === 'both') {
      console.log('📱 Testing push notification...');
      const pushResult = await testNotification('push');
      if (pushResult.status === 200) {
        console.log('✅ Push notification sent successfully');
        console.log('   Response:', JSON.stringify(pushResult.data, null, 2));
      } else {
        console.log('❌ Push notification failed');
        console.log('   Status:', pushResult.status);
        console.log('   Response:', JSON.stringify(pushResult.data, null, 2));
      }
      console.log('');
    }

    if (TEST_TYPE === 'email' || TEST_TYPE === 'both') {
      console.log('📧 Testing email notification...');
      const emailResult = await testNotification('email');
      if (emailResult.status === 200) {
        console.log('✅ Email notification sent successfully');
        console.log('   Response:', JSON.stringify(emailResult.data, null, 2));
      } else {
        console.log('❌ Email notification failed');
        console.log('   Status:', emailResult.status);
        console.log('   Response:', JSON.stringify(emailResult.data, null, 2));
      }
      console.log('');
    }

    console.log('✨ Test complete!');
    console.log('\nNote: Make sure the recipient user:');
    console.log('  - Has a valid expo_push_token in profiles (for push)');
    console.log('  - Has a valid email in users table (for email)');
    console.log('  - Is authenticated (if testing protected endpoints)');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

