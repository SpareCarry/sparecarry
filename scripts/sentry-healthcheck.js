#!/usr/bin/env node
/**
 * Sentry Health Check Script
 * 
 * Validates Sentry integration by attempting to initialize and send a test event
 * Only runs in dry-run mode to avoid polluting production Sentry
 */

const https = require('https');
const http = require('http');

// Configuration
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true for safety
const SENTRY_URL = process.env.SENTRY_URL || 'https://sentry.io';

// Parse DSN
function parseDSN(dsn) {
  if (!dsn) return null;
  
  const match = dsn.match(/^https?:\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!match) return null;
  
  const [, publicKey, host, projectId] = match;
  return {
    publicKey,
    host,
    projectId,
    protocol: dsn.startsWith('https') ? 'https' : 'http',
  };
}

// Send test event to Sentry
function sendTestEvent(dsnInfo, dryRun = true) {
  return new Promise((resolve, reject) => {
    if (dryRun) {
      // In dry-run mode, we just validate the DSN format and connection
      console.log('✓ Dry-run mode: Validating Sentry DSN format...');
      console.log(`  Host: ${dsnInfo.host}`);
      console.log(`  Project ID: ${dsnInfo.projectId}`);
      console.log(`  Protocol: ${dsnInfo.protocol}`);
      
      // Test connection to Sentry host
      const protocol = dsnInfo.protocol === 'https' ? https : http;
      const testUrl = new URL(`${dsnInfo.protocol}://${dsnInfo.host}`);
      
      const req = protocol.request({
        hostname: testUrl.hostname,
        port: testUrl.port || (dsnInfo.protocol === 'https' ? 443 : 80),
        path: '/',
        method: 'HEAD',
        timeout: 5000,
      }, (res) => {
        console.log(`✓ Sentry host is reachable (${res.statusCode})`);
        resolve({
          success: true,
          dryRun: true,
          message: 'Sentry DSN is valid and host is reachable',
        });
      });
      
      req.on('error', (error) => {
        console.error('✗ Failed to reach Sentry host:', error.message);
        reject({
          success: false,
          error: error.message,
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject({
          success: false,
          error: 'Connection timeout',
        });
      });
      
      req.end();
    } else {
      // In non-dry-run mode, send an actual test event
      console.log('⚠️  Non-dry-run mode: Sending test event to Sentry...');
      
      const testEvent = {
        message: {
          message: 'Sentry health check test event',
        },
        level: 'info',
        tags: {
          source: 'healthcheck',
          environment: process.env.NODE_ENV || 'test',
        },
        extra: {
          timestamp: new Date().toISOString(),
          dryRun: false,
        },
      };
      
      const eventJson = JSON.stringify(testEvent);
      const eventId = Buffer.from(eventJson).toString('base64').substring(0, 32);
      
      const path = `/api/${dsnInfo.projectId}/store/`;
      const url = new URL(`${dsnInfo.protocol}://${dsnInfo.host}${path}`);
      
      const protocol = dsnInfo.protocol === 'https' ? https : http;
      const postData = `sentry_version=7&sentry_key=${dsnInfo.publicKey}&sentry_client=healthcheck/1.0&sentry_timestamp=${Math.floor(Date.now() / 1000)}&sentry_event_id=${eventId}&sentry_data=${encodeURIComponent(eventJson)}`;
      
      const req = protocol.request({
        hostname: url.hostname,
        port: url.port || (dsnInfo.protocol === 'https' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsnInfo.publicKey}, sentry_client=healthcheck/1.0, sentry_timestamp=${Math.floor(Date.now() / 1000)}`,
        },
        timeout: 10000,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✓ Test event sent successfully');
            resolve({
              success: true,
              dryRun: false,
              message: 'Test event sent to Sentry',
              eventId: eventId,
            });
          } else {
            console.error(`✗ Sentry returned status ${res.statusCode}: ${data}`);
            reject({
              success: false,
              error: `Sentry returned status ${res.statusCode}`,
              response: data,
            });
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('✗ Failed to send test event:', error.message);
        reject({
          success: false,
          error: error.message,
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject({
          success: false,
          error: 'Request timeout',
        });
      });
      
      req.write(postData);
      req.end();
    }
  });
}

// Main health check
async function healthCheck() {
  console.log('🔍 Sentry Health Check\n');
  
  // Check if DSN is provided
  if (!SENTRY_DSN) {
    console.log('⚠️  SENTRY_DSN not set - skipping Sentry health check');
    console.log('   This is OK if Sentry is not configured');
    process.exit(0);
  }
  
  // Parse DSN
  const dsnInfo = parseDSN(SENTRY_DSN);
  if (!dsnInfo) {
    console.error('✗ Invalid Sentry DSN format');
    console.error('   Expected format: https://<key>@<host>/<project-id>');
    process.exit(1);
  }
  
  console.log(`✓ Sentry DSN format is valid`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}\n`);
  
  try {
    const result = await sendTestEvent(dsnInfo, DRY_RUN);
    console.log(`\n✅ ${result.message}`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Health check failed: ${error.error || error.message}`);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    process.exit(1);
  }
}

// Run health check
healthCheck().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

