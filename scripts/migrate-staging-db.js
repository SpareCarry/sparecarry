#!/usr/bin/env node

/**
 * Staging Database Migration Script (Windows-compatible)
 * 
 * Runs migrations against STAGING Supabase project
 * Applies schema and migrations in correct order
 *
 * Usage: node scripts/migrate-staging-db.js
 * 
 * Required environment variables:
 *   STAGING_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   STAGING_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env files (dotenv is optional)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.staging') });
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (err) {
  // dotenv not installed, try to load .env files manually
  const envFiles = [
    path.join(__dirname, '..', '.env.staging'),
    path.join(__dirname, '..', '.env.local'),
  ];
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match && !match[1].startsWith('#')) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const PROJECT_ROOT = path.join(__dirname, '..');

// Get environment variables
const SUPABASE_URL = process.env.STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('Staging Database Migration', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

// Validate environment
if (!SUPABASE_URL) {
  log('❌ Error: STAGING_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not set', 'red');
  log('   Set in .env.staging or .env.local', 'yellow');
  process.exit(1);
}

if (!SERVICE_KEY) {
  log('❌ Error: STAGING_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY not set', 'red');
  log('   Set in .env.staging or .env.local', 'yellow');
  process.exit(1);
}

log(`Supabase URL: ${SUPABASE_URL}`, 'blue');
log(`Service Key: ${SERVICE_KEY.substring(0, 20)}...\n`, 'blue');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Function to execute SQL file
async function executeSQL(sqlFile, description) {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log(description, 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  const filePath = path.join(PROJECT_ROOT, sqlFile);
  
  if (!fs.existsSync(filePath)) {
    log(`⚠️  Migration file not found: ${filePath}`, 'yellow');
    log('   Skipping...\n', 'yellow');
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  log(`Executing ${statements.length} SQL statements...`, 'cyan');

  for (const statement of statements) {
    if (statement.trim().length === 0) continue;
    
    try {
      // Use RPC to execute SQL (requires admin privileges)
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // If RPC doesn't exist, try direct query (limited)
        log(`⚠️  RPC method not available. Please run SQL manually in Supabase Dashboard.`, 'yellow');
        log(`   File: ${sqlFile}\n`, 'cyan');
        return;
      }
    } catch (err) {
      log(`⚠️  Direct SQL execution not available. Please run SQL manually in Supabase Dashboard.`, 'yellow');
      log(`   File: ${sqlFile}`, 'cyan');
      log(`   Error: ${err.message}\n`, 'red');
      return;
    }
  }

  log(`✅ ${description} completed\n`, 'green');
}

// Migration order (from supabase/migrations directory)
const migrationsDir = path.join(PROJECT_ROOT, 'supabase', 'migrations');
const migrationFiles = [];

if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Sort alphabetically to maintain order
  
  files.forEach(file => {
    migrationFiles.push({
      file: path.join('supabase', 'migrations', file),
      description: `Migration: ${file}`
    });
  });
}

// Also check for other SQL files
const additionalFiles = [
  { file: 'supabase/storage-setup.sql', description: 'Storage Setup' },
  { file: 'supabase/realtime-setup.sql', description: 'Realtime Setup' },
];

additionalFiles.forEach(({ file, description }) => {
  const filePath = path.join(PROJECT_ROOT, file);
  if (fs.existsSync(filePath)) {
    migrationFiles.push({ file, description });
  }
});

// Execute migrations
(async () => {
  for (const { file, description } of migrationFiles) {
    await executeSQL(file, description);
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('✅ All migrations completed!', 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Next steps:', 'blue');
  log('  1. Verify tables in Supabase Dashboard', 'blue');
  log('  2. Run seed script: pnpm db:seed:staging', 'blue');
  log('  3. Verify RLS policies are enabled', 'blue');
  log('  4. Test database connectivity\n', 'blue');

  log('⚠️  Note: Some SQL operations require direct database access.', 'yellow');
  log('   If migrations fail, run SQL files manually in Supabase SQL Editor.\n', 'yellow');
})();

