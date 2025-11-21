#!/usr/bin/env node

/**
 * Post-build script to fix @/ path aliases in Next.js static export
 * 
 * This script replaces @/ imports with relative paths in the built output
 * to work around Next.js 14.2.18's bug with webpack aliases in static export.
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '..', 'out');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const shouldSkipAliasFix =
  process.env.VERCEL === '1' || process.env.SKIP_ALIAS_FIX === '1';

if (shouldSkipAliasFix) {
  const reason =
    process.env.VERCEL === '1'
      ? 'Detected Vercel build (using Next.js server output)'
      : 'SKIP_ALIAS_FIX flag is set';
  console.log(`⚠️  Skipping alias fix script: ${reason}`);
  process.exit(0);
}

// Track statistics
const stats = {
  filesProcessed: 0,
  importsFixed: 0,
  errors: []
};

/**
 * Recursively find all files matching the given extensions
 */
function findFiles(dir, extensions, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.warn(`Warning: Directory ${dir} does not exist`);
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next') {
        findFiles(filePath, extensions, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Build a map of @/ paths to actual file locations in out/
 * Also maps based on the source project structure
 */
function buildPathMap(outDir) {
  const pathMap = new Map();
  const projectRoot = path.resolve(__dirname, '..');
  
  // First, try to map based on source project structure
  // This helps us know where files SHOULD be
  const sourceDirs = ['components', 'lib', 'app', 'types'];
  
  sourceDirs.forEach(dir => {
    const sourceDir = path.join(projectRoot, dir);
    if (fs.existsSync(sourceDir)) {
      const files = findFiles(sourceDir, ['.ts', '.tsx', '.js', '.jsx']);
      files.forEach(filePath => {
        const relativePath = path.relative(projectRoot, filePath);
        const importPath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');
        const alias = `@/${importPath}`;
        
        // Try to find corresponding file in out/
        const possiblePaths = [
          path.join(outDir, importPath + '.js'),
          path.join(outDir, importPath + '.mjs'),
          path.join(outDir, importPath.replace(/\\/g, '/') + '.js'),
          path.join(outDir, importPath.replace(/\\/g, '/') + '.mjs'),
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            pathMap.set(alias, possiblePath);
            break;
          }
        }
      });
    }
  });
  
  // Also scan built files to find actual locations
  const jsFiles = findFiles(outDir, ['.js', '.mjs']);
  
  jsFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract @/ imports to understand what's being imported
      const importRegex = /["']@\/([^"']+)["']/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const alias = `@/${importPath}`;
        
        if (!pathMap.has(alias)) {
          // Try to find the actual file in various locations
          const possiblePaths = [
            path.join(outDir, importPath + '.js'),
            path.join(outDir, importPath + '.mjs'),
            path.join(outDir, importPath.replace(/\//g, path.sep) + '.js'),
            path.join(outDir, importPath.replace(/\//g, path.sep) + '.mjs'),
            path.join(outDir, importPath.replace(/\//g, path.sep), 'index.js'),
            path.join(outDir, importPath.replace(/\//g, path.sep), 'index.mjs'),
            // Check _next/static/chunks
            path.join(outDir, '_next', 'static', 'chunks', importPath + '.js'),
            path.join(outDir, '_next', 'static', 'chunks', importPath + '.mjs'),
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              pathMap.set(alias, possiblePath);
              break;
            }
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  return pathMap;
}

/**
 * Find target file for a given @/ import
 */
function findTargetFile(alias, importPath, currentFile) {
  // Try path map first
  if (pathMap.has(alias)) {
    return pathMap.get(alias);
  }
  
  // Try to find the file by searching common locations
  const searchPaths = [
    path.join(OUT_DIR, importPath + '.js'),
    path.join(OUT_DIR, importPath + '.mjs'),
    path.join(OUT_DIR, importPath.replace(/\//g, path.sep) + '.js'),
    path.join(OUT_DIR, importPath.replace(/\//g, path.sep) + '.mjs'),
    path.join(OUT_DIR, importPath.replace(/\//g, path.sep), 'index.js'),
    path.join(OUT_DIR, importPath.replace(/\//g, path.sep), 'index.mjs'),
    // Check _next/static/chunks
    path.join(OUT_DIR, '_next', 'static', 'chunks', importPath + '.js'),
    path.join(OUT_DIR, '_next', 'static', 'chunks', importPath + '.mjs'),
  ];
  
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      return searchPath;
    }
  }
  
  return null;
}

/**
 * Calculate relative path from source file to target file
 */
function getRelativePath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const relative = path.relative(fromDir, toFile);
  
  // Normalize path separators for web (use forward slashes)
  return relative.replace(/\\/g, '/');
}

/**
 * Normalize relative path for imports
 */
function normalizeRelativePath(relativePath, removeExtension) {
  // Ensure relative path starts with ./ or ../
  let normalized = relativePath.startsWith('.') 
    ? relativePath 
    : './' + relativePath;
  
  // Remove file extension for ES modules if requested
  if (removeExtension) {
    normalized = normalized.replace(/\.(js|mjs)$/, '');
  }
  
  return normalized;
}

// Make pathMap available to helper functions
let pathMap = null;

/**
 * Fix @/ imports in a file
 */
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileImportsFixed = 0;

    // More comprehensive patterns to match various import styles
    // Pattern 1: ES6 imports - import ... from "@/path"
    const es6ImportPattern = /(import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+)?from\s+)(["'])@\/([^"']+)\2/g;
    
    // Pattern 2: Dynamic imports - import("@/path")
    const dynamicImportPattern = /(import\s*\()(["'])@\/([^"']+)\2(\s*\))/g;
    
    // Pattern 3: require("@/path")
    const requirePattern = /(require\s*\()(["'])@\/([^"']+)\2(\s*\))/g;
    
    // Pattern 4: from "@/path" (standalone)
    const fromPattern = /(from\s+)(["'])@\/([^"']+)\2/g;

    // Fix ES6 imports: import ... from "@/path"
    content = content.replace(es6ImportPattern, (match, prefix, quote, importPath) => {
      const alias = `@/${importPath}`;
      const targetFile = findTargetFile(alias, importPath, filePath);
      
      if (targetFile) {
        const relativePath = getRelativePath(filePath, targetFile);
        const normalizedPath = normalizeRelativePath(relativePath, true); // Remove .js for ES modules
        modified = true;
        fileImportsFixed++;
        return `${prefix}${quote}${normalizedPath}${quote}`;
      } else {
        stats.errors.push(`Could not find target for ${alias} in ${filePath}`);
        return match;
      }
    });
    
    // Fix dynamic imports: import("@/path")
    content = content.replace(dynamicImportPattern, (match, prefix, quote, importPath, suffix) => {
      const alias = `@/${importPath}`;
      const targetFile = findTargetFile(alias, importPath, filePath);
      
      if (targetFile) {
        const relativePath = getRelativePath(filePath, targetFile);
        const normalizedPath = normalizeRelativePath(relativePath, true); // Remove .js for ES modules
        modified = true;
        fileImportsFixed++;
        return `${prefix}${quote}${normalizedPath}${quote}${suffix}`;
      } else {
        stats.errors.push(`Could not find target for ${alias} in ${filePath}`);
        return match;
      }
    });
    
    // Fix require("@/path")
    content = content.replace(requirePattern, (match, prefix, quote, importPath, suffix) => {
      const alias = `@/${importPath}`;
      const targetFile = findTargetFile(alias, importPath, filePath);
      
      if (targetFile) {
        const relativePath = getRelativePath(filePath, targetFile);
        const normalizedPath = normalizeRelativePath(relativePath, false); // Keep .js for require
        modified = true;
        fileImportsFixed++;
        return `${prefix}${quote}${normalizedPath}${quote}${suffix}`;
      } else {
        stats.errors.push(`Could not find target for ${alias} in ${filePath}`);
        return match;
      }
    });
    
    // Fix standalone from "@/path"
    content = content.replace(fromPattern, (match, prefix, quote, importPath) => {
      const alias = `@/${importPath}`;
      const targetFile = findTargetFile(alias, importPath, filePath);
      
      if (targetFile) {
        const relativePath = getRelativePath(filePath, targetFile);
        const normalizedPath = normalizeRelativePath(relativePath, true); // Remove .js for ES modules
        modified = true;
        fileImportsFixed++;
        return `${prefix}${quote}${normalizedPath}${quote}`;
      } else {
        stats.errors.push(`Could not find target for ${alias} in ${filePath}`);
        return match;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesProcessed++;
      stats.importsFixed += fileImportsFixed;
      return fileImportsFixed;
    }

    return 0;
  } catch (error) {
    stats.errors.push(`Error processing ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔧 Fixing @/ path aliases in static export...\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.log(`ℹ️  ${OUT_DIR} does not exist. Skipping alias fix step.`);
    return;
  }

  // Build path map
  console.log('📋 Building path map...');
  const pathMapInstance = buildPathMap(OUT_DIR);
  console.log(`   Found ${pathMapInstance.size} mapped paths\n`);

  // Find all files to process
  console.log('🔍 Finding files to process...');
  const files = [
    ...findFiles(OUT_DIR, ['.js', '.mjs']),
    ...findFiles(OUT_DIR, ['.html']),
  ];
  console.log(`   Found ${files.length} files to process\n`);

  // Store pathMap globally for helper functions
  pathMap = pathMapInstance;
  
  // Process each file
  console.log('🔄 Processing files...');
  files.forEach((file, index) => {
    if ((index + 1) % 50 === 0) {
      process.stdout.write(`   Processed ${index + 1}/${files.length} files...\r`);
    }
    fixImportsInFile(file);
  });
  console.log(`   Processed ${files.length} files\n`);

  // Print results
  console.log('✅ Fix complete!\n');
  console.log('📊 Statistics:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Imports fixed: ${stats.importsFixed}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Warnings (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach(error => {
      console.log(`   - ${error}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }

  if (stats.importsFixed === 0 && stats.errors.length === 0) {
    console.log('\n💡 No @/ imports found to fix. This might mean:');
    console.log('   1. The build already has correct paths');
    console.log('   2. No files use @/ imports');
    console.log('   3. Files are in a different location than expected');
  }

  console.log('\n✨ Done!');
}

// Run the script
main();

