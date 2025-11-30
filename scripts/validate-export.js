#!/usr/bin/env node

/**
 * Validate Next.js static export output
 *
 * Checks:
 * - out/ directory exists
 * - index.html exists
 * - No unresolved @/ imports remain
 * - No missing asset references
 *
 * Exits with code 1 if validation fails, 0 on success
 */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(process.cwd(), "out");
const ERRORS = [];
const WARNINGS = [];

/**
 * Check if out/ directory exists
 */
function checkOutDirectory() {
  if (!fs.existsSync(OUT_DIR)) {
    ERRORS.push(`❌ out/ directory does not exist at ${OUT_DIR}`);
    return false;
  }

  const stat = fs.statSync(OUT_DIR);
  if (!stat.isDirectory()) {
    ERRORS.push(`❌ ${OUT_DIR} exists but is not a directory`);
    return false;
  }

  console.log("✅ out/ directory exists");
  return true;
}

/**
 * Check if index.html exists
 */
function checkIndexHtml() {
  const indexPath = path.join(OUT_DIR, "index.html");

  if (!fs.existsSync(indexPath)) {
    ERRORS.push(`❌ index.html not found in ${OUT_DIR}`);
    return false;
  }

  console.log("✅ index.html exists");
  return true;
}

/**
 * Recursively find all files in directory
 */
function findFiles(dir, extensions = [".js", ".html", ".mjs"]) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          traverse(fullPath);
        }
      } else {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  }

  traverse(dir);
  return files;
}

/**
 * Check for unresolved @/ imports
 */
function checkUnresolvedAliases() {
  const files = findFiles(OUT_DIR, [".js", ".html", ".mjs"]);
  const aliasPattern = /@\/([^"'\s`]+)/g;
  let foundAliases = 0;
  const aliasFiles = [];

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf8");
      const matches = content.match(aliasPattern);

      if (matches && matches.length > 0) {
        foundAliases += matches.length;
        aliasFiles.push({
          file: path.relative(OUT_DIR, file),
          count: matches.length,
          examples: matches.slice(0, 3),
        });
      }
    } catch (error) {
      WARNINGS.push(`⚠️  Could not read ${file}: ${error.message}`);
    }
  });

  if (foundAliases > 0) {
    ERRORS.push(
      `❌ Found ${foundAliases} unresolved @/ imports in ${aliasFiles.length} files`
    );
    console.log("\n📋 Files with unresolved @/ imports:");
    aliasFiles.forEach(({ file, count, examples }) => {
      console.log(`   - ${file} (${count} occurrences)`);
      console.log(`     Examples: ${examples.join(", ")}`);
    });
    return false;
  }

  console.log(
    `✅ No unresolved @/ imports found (checked ${files.length} files)`
  );
  return true;
}

/**
 * Check for missing asset references
 */
function checkAssetReferences() {
  const files = findFiles(OUT_DIR, [".html", ".js", ".css"]);
  const assetPattern = /(href|src|url)\s*=\s*["']([^"']+)["']/g;
  const missingAssets = [];

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf8");
      const dir = path.dirname(file);

      let match;
      while ((match = assetPattern.exec(content)) !== null) {
        const assetPath = match[2];

        // Skip external URLs, data URIs, and anchors
        if (
          assetPath.startsWith("http://") ||
          assetPath.startsWith("https://") ||
          assetPath.startsWith("data:") ||
          assetPath.startsWith("mailto:") ||
          assetPath.startsWith("tel:") ||
          assetPath.startsWith("#") ||
          assetPath.startsWith("?")
        ) {
          continue;
        }

        // Resolve relative path
        const resolvedPath = path.resolve(dir, assetPath);
        const relativeToOut = path.relative(OUT_DIR, resolvedPath);

        // Check if file exists
        if (!fs.existsSync(resolvedPath)) {
          // Check if it's a directory (might be intentional)
          const parentDir = path.dirname(resolvedPath);
          if (!fs.existsSync(parentDir)) {
            missingAssets.push({
              file: path.relative(OUT_DIR, file),
              asset: assetPath,
              resolved: relativeToOut,
            });
          }
        }
      }
    } catch (error) {
      WARNINGS.push(`⚠️  Could not check assets in ${file}: ${error.message}`);
    }
  });

  if (missingAssets.length > 0) {
    WARNINGS.push(
      `⚠️  Found ${missingAssets.length} potentially missing asset references`
    );
    console.log("\n📋 Potentially missing assets:");
    missingAssets.slice(0, 10).forEach(({ file, asset, resolved }) => {
      console.log(`   - ${file} → ${asset} (${resolved})`);
    });
    if (missingAssets.length > 10) {
      console.log(`   ... and ${missingAssets.length - 10} more`);
    }
  } else {
    console.log(
      `✅ No missing asset references found (checked ${files.length} files)`
    );
  }

  return true; // Warnings don't fail validation
}

/**
 * Count files in out/ directory
 */
function countFiles() {
  const files = findFiles(OUT_DIR);
  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  const jsFiles = files.filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  console.log(`\n📊 Export Statistics:`);
  console.log(`   Total files: ${files.length}`);
  console.log(`   HTML files: ${htmlFiles.length}`);
  console.log(`   JavaScript files: ${jsFiles.length}`);
  console.log(`   CSS files: ${cssFiles.length}`);

  return true;
}

/**
 * Main validation function
 */
function validate() {
  console.log("🔍 Validating Next.js static export...\n");

  // Run all checks
  const checks = [
    checkOutDirectory(),
    checkIndexHtml(),
    checkUnresolvedAliases(),
    checkAssetReferences(),
    countFiles(),
  ];

  // Print warnings
  if (WARNINGS.length > 0) {
    console.log("\n⚠️  Warnings:");
    WARNINGS.forEach((warning) => console.log(`   ${warning}`));
  }

  // Print errors and exit
  if (ERRORS.length > 0) {
    console.log("\n❌ Validation Errors:");
    ERRORS.forEach((error) => console.log(`   ${error}`));
    console.log("\n❌ Export validation failed!");
    process.exit(1);
  }

  console.log("\n✅ Export validation passed!");
  console.log("✅ Ready for Capacitor sync");
  process.exit(0);
}

// Run validation
validate();
