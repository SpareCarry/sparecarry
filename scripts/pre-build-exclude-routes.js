#!/usr/bin/env node

/**
 * Pre-build script to temporarily exclude API routes and route handlers
 * from static export build
 * 
 * This script moves server-only routes to a temporary location before build,
 * then restores them after build completes.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(PROJECT_ROOT, '.routes-temp');
const isVercelBuild = process.env.VERCEL === '1';
const shouldSkipForEnv =
  isVercelBuild || process.env.SKIP_ROUTE_EXCLUSION === '1';

// Routes to exclude from static export
const ROUTES_TO_EXCLUDE = [
  'app/api',
  'app/auth/callback', // Route handler, not a page
];

// Files to exclude from static export
const FILES_TO_EXCLUDE = [
  'middleware.ts', // Middleware requires server runtime
];

/**
 * Move routes to temporary location
 */
function excludeRoutes() {
  if (fs.existsSync(TEMP_DIR)) {
    // Clean up any existing temp directory
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  ROUTES_TO_EXCLUDE.forEach(route => {
    const sourcePath = path.join(PROJECT_ROOT, route);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(TEMP_DIR, route);
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.renameSync(sourcePath, destPath);
      console.log(`✅ Excluded: ${route}`);
    }
  });

  FILES_TO_EXCLUDE.forEach(file => {
    const sourcePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(TEMP_DIR, file);
      fs.renameSync(sourcePath, destPath);
      console.log(`✅ Excluded: ${file}`);
    }
  });
}

/**
 * Restore routes from temporary location
 */
function restoreRoutes() {
  if (!fs.existsSync(TEMP_DIR)) {
    return;
  }

  ROUTES_TO_EXCLUDE.forEach(route => {
    const sourcePath = path.join(TEMP_DIR, route);
    const destPath = path.join(PROJECT_ROOT, route);
    
    if (fs.existsSync(sourcePath)) {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.renameSync(sourcePath, destPath);
      console.log(`✅ Restored: ${route}`);
    }
  });

  FILES_TO_EXCLUDE.forEach(file => {
    const sourcePath = path.join(TEMP_DIR, file);
    const destPath = path.join(PROJECT_ROOT, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, destPath);
      console.log(`✅ Restored: ${file}`);
    }
  });

  // Clean up temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

// Main execution
const command = process.argv[2];

if (command !== 'restore' && shouldSkipForEnv) {
  const reason = isVercelBuild
    ? 'Detected Vercel build (server functions must stay in place)'
    : 'SKIP_ROUTE_EXCLUSION flag is set';
  console.log(`⚠️  Skipping route exclusion: ${reason}`);
  process.exit(0);
}

if (command === 'restore') {
  console.log('🔄 Restoring excluded routes...');
  restoreRoutes();
  console.log('✅ Routes restored');
  process.exit(0);
}

// Pre-build: Exclude routes
console.log('🔧 Excluding server-only routes from static export...');
excludeRoutes();
console.log('✅ Routes excluded');

