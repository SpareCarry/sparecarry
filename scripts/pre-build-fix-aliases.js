#!/usr/bin/env node

/**
 * Pre-build script to temporarily fix @/ path aliases for Next.js build
 *
 * This script temporarily replaces @/ imports with relative paths in source files
 * to allow the build to succeed, then restores them after build.
 *
 * NOTE: This modifies source files temporarily. Original files are backed up.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const BACKUP_DIR = path.join(PROJECT_ROOT, ".alias-backup");

// Track modified files for restoration
const modifiedFiles = [];

/**
 * Calculate relative path from source file to target file
 */
function getRelativePath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const relative = path.relative(fromDir, toFile);
  return relative.replace(/\\/g, "/");
}

/**
 * Find target file for @/ import
 */
function findTargetFile(importPath, currentFile) {
  const projectRoot = path.dirname(currentFile);
  let searchDir = projectRoot;

  // Try to find the file by searching up the directory tree
  const possiblePaths = [
    path.join(PROJECT_ROOT, importPath + ".ts"),
    path.join(PROJECT_ROOT, importPath + ".tsx"),
    path.join(PROJECT_ROOT, importPath + ".js"),
    path.join(PROJECT_ROOT, importPath + ".jsx"),
    path.join(PROJECT_ROOT, importPath, "index.ts"),
    path.join(PROJECT_ROOT, importPath, "index.tsx"),
    path.join(PROJECT_ROOT, importPath, "index.js"),
    path.join(PROJECT_ROOT, importPath, "index.jsx"),
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  return null;
}

/**
 * Fix @/ imports in a file (temporarily)
 */
function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check if file has @/ imports
    if (!content.includes("@/")) {
      return false;
    }

    // Create backup
    const backupPath = path.join(
      BACKUP_DIR,
      path.relative(PROJECT_ROOT, filePath)
    );
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(backupPath, content, "utf8");

    let modified = false;
    let newContent = content;

    // Pattern for ES6 imports: import ... from "@/path"
    const es6ImportPattern =
      /(import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+)?from\s+)(["'])@\/([^"']+)\2/g;

    newContent = newContent.replace(
      es6ImportPattern,
      (match, prefix, quote, importPath) => {
        const targetFile = findTargetFile(importPath, filePath);
        if (targetFile) {
          const relativePath = getRelativePath(filePath, targetFile);
          const normalizedPath = relativePath.startsWith(".")
            ? relativePath
            : "./" + relativePath;
          const finalPath = normalizedPath.replace(/\.(ts|tsx|js|jsx)$/, "");
          modified = true;
          return `${prefix}${quote}${finalPath}${quote}`;
        }
        return match;
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, newContent, "utf8");
      modifiedFiles.push(filePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Restore original files from backup
 */
function restoreFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }

  function restoreRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        restoreRecursive(fullPath);
      } else {
        const relativePath = path.relative(BACKUP_DIR, fullPath);
        const targetPath = path.join(PROJECT_ROOT, relativePath);

        if (fs.existsSync(targetPath)) {
          const backupContent = fs.readFileSync(fullPath, "utf8");
          fs.writeFileSync(targetPath, backupContent, "utf8");
        }
      }
    });
  }

  restoreRecursive(BACKUP_DIR);

  // Clean up backup directory
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}

/**
 * Find all TypeScript/JavaScript files
 */
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, out, and backup directories
      // Also skip API routes - they're not included in static export
      if (
        !["node_modules", ".next", "out", ".alias-backup"].includes(file) &&
        !filePath.includes("app/api")
      ) {
        findSourceFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Main execution
const command = process.argv[2];

if (command === "restore") {
  console.log("🔄 Restoring original files from backup...");
  restoreFiles();
  console.log("✅ Files restored");
  process.exit(0);
}

// Pre-build: Fix imports
console.log("🔧 Temporarily fixing @/ imports for build...");

// Create backup directory
if (fs.existsSync(BACKUP_DIR)) {
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Find and fix all source files
const sourceFiles = findSourceFiles(PROJECT_ROOT);
let fixedCount = 0;

sourceFiles.forEach((file) => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`✅ Temporarily fixed ${fixedCount} files`);
console.log(`📝 Backup created in ${BACKUP_DIR}`);
console.log(
  '💡 Run "node scripts/pre-build-fix-aliases.js restore" to restore original files'
);
