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
  // Note: app/auth/callback is now a client-side page, so it should be included in the build
];

// Files to exclude from static export
const FILES_TO_EXCLUDE = [
  'middleware.ts', // Middleware requires server runtime
];

/**
 * Copy directory recursively (sync)
 */
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Move routes to temporary location
 * Uses copy + delete instead of rename on Windows to avoid permission issues
 */
function excludeRoutes() {
  if (fs.existsSync(TEMP_DIR)) {
    // Clean up any existing temp directory
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (err) {
      console.warn(`Warning: Could not clean temp dir: ${err.message}`);
    }
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
      
      try {
        // On Windows, use copy + delete instead of rename to avoid permission issues
        copyRecursiveSync(sourcePath, destPath);
        
        // Remove source after successful copy
        // Use try-catch and retry logic for Windows
        let removed = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            // Wait a bit before attempting removal (helps with Windows file locks)
            if (attempt > 0) {
              const sleepStart = Date.now();
              while (Date.now() - sleepStart < 100 * attempt) {
                // Busy wait (acceptable for small delays)
              }
            }
            
            fs.rmSync(sourcePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
            removed = true;
            break;
          } catch (err) {
            if (attempt === 4) {
              console.warn(`Warning: Could not remove ${sourcePath} after 5 attempts: ${err.message}`);
              console.warn(`The copy was successful - you may need to manually remove ${sourcePath}`);
            }
          }
        }
        
        if (removed || !fs.existsSync(sourcePath)) {
          console.log(`✅ Excluded: ${route}`);
        }
      } catch (err) {
        console.error(`Error excluding ${route}: ${err.message}`);
        throw err;
      }
    }
  });

  FILES_TO_EXCLUDE.forEach(file => {
    const sourcePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(TEMP_DIR, file);
      
      try {
        // For files, copy then delete
        fs.copyFileSync(sourcePath, destPath);
        
        // Try to remove original file
        let removed = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            // Wait a bit before attempting removal (helps with Windows file locks)
            if (attempt > 0) {
              const sleepStart = Date.now();
              while (Date.now() - sleepStart < 100 * attempt) {
                // Busy wait (acceptable for small delays)
              }
            }
            
            fs.unlinkSync(sourcePath);
            removed = true;
            break;
          } catch (err) {
            if (attempt === 4) {
              console.warn(`Warning: Could not remove ${sourcePath}: ${err.message}`);
            }
          }
        }
        
        if (removed || !fs.existsSync(sourcePath)) {
          console.log(`✅ Excluded: ${file}`);
        }
      } catch (err) {
        console.error(`Error excluding ${file}: ${err.message}`);
        throw err;
      }
    }
  });
}

/**
 * Restore routes from temporary location
 * Uses copy + delete instead of rename to avoid Windows permission issues
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
      
      // Use copy + delete instead of rename for Windows compatibility
      try {
        // Remove destination if it exists
        if (fs.existsSync(destPath)) {
          fs.rmSync(destPath, { recursive: true, force: true });
        }
        
        // Copy from temp
        copyRecursiveSync(sourcePath, destPath);
        
        // Remove temp copy
        fs.rmSync(sourcePath, { recursive: true, force: true });
        
        console.log(`✅ Restored: ${route}`);
      } catch (err) {
        console.error(`Error restoring ${route}: ${err.message}`);
        throw err;
      }
    }
  });

  FILES_TO_EXCLUDE.forEach(file => {
    const sourcePath = path.join(TEMP_DIR, file);
    const destPath = path.join(PROJECT_ROOT, file);
    
    if (fs.existsSync(sourcePath)) {
      try {
        // Remove destination if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        
        // Copy from temp
        fs.copyFileSync(sourcePath, destPath);
        
        // Remove temp copy
        fs.unlinkSync(sourcePath);
        
        console.log(`✅ Restored: ${file}`);
      } catch (err) {
        console.error(`Error restoring ${file}: ${err.message}`);
        throw err;
      }
    }
  });

  // Clean up temp directory
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch (err) {
    console.warn(`Warning: Could not remove temp directory: ${err.message}`);
  }
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

