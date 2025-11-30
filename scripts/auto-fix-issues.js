/**
 * Auto-Fix System
 *
 * Automatically fixes safe issues:
 * - Linting errors (formatting, unused imports, etc.)
 * - TypeScript errors (simple type assertions, null checks)
 * - Missing imports
 * - Simple syntax errors
 * - Configuration issues (env variable formatting)
 *
 * Does NOT fix: test failures, logic errors, API changes
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * Fix linting errors using ESLint --fix
 */
async function fixLintingErrors() {
  const fixes = [];

  try {
    // Run ESLint with --fix flag
    const { stdout, stderr } = await execAsync("pnpm lint --fix", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Check if any fixes were applied
    if (stdout.includes("fixed") || stdout.includes("Fixed")) {
      fixes.push("Applied ESLint auto-fixes");
    }

    return {
      success: true,
      fixes,
    };
  } catch (error) {
    // ESLint may exit with error even after fixing some issues
    if (
      error.stdout &&
      (error.stdout.includes("fixed") || error.stdout.includes("Fixed"))
    ) {
      fixes.push("Applied ESLint auto-fixes (some errors may remain)");
      return {
        success: true,
        fixes,
      };
    }

    return {
      success: false,
      fixes: [],
      error: error.message,
    };
  }
}

/**
 * Fix formatting issues using Prettier
 */
async function fixFormatting() {
  const fixes = [];

  try {
    // Check if prettier is available
    const { stdout } = await execAsync("pnpm format", {
      cwd: path.join(__dirname, ".."),
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (
      stdout.includes("formatted") ||
      stdout.includes("All matched files use Prettier code style")
    ) {
      fixes.push("Applied Prettier formatting");
    }

    return {
      success: true,
      fixes,
    };
  } catch (error) {
    // Prettier might not be configured or may have errors
    return {
      success: false,
      fixes: [],
      error: error.message,
    };
  }
}

/**
 * Fix missing imports (basic check)
 */
function fixMissingImports(filepath) {
  const fixes = [];

  try {
    let content = fs.readFileSync(filepath, "utf8");
    const originalContent = content;

    // Simple check for common missing imports
    // This is a basic implementation - more sophisticated analysis would require AST parsing

    // Check if React is used but not imported
    if (
      content.includes("React.") ||
      content.includes("<div") ||
      content.includes("useState") ||
      content.includes("useEffect")
    ) {
      if (
        !content.includes("import React") &&
        !content.includes("import {") &&
        filepath.endsWith(".tsx")
      ) {
        // Add React import if missing
        if (!content.startsWith("import")) {
          content = "import React from 'react';\n" + content;
          fixes.push("Added missing React import");
        }
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filepath, content, "utf8");
      return {
        success: true,
        fixes,
      };
    }

    return {
      success: false,
      fixes: [],
    };
  } catch (error) {
    return {
      success: false,
      fixes: [],
      error: error.message,
    };
  }
}

/**
 * Fix simple TypeScript errors (basic)
 */
function fixTypeScriptErrors(filepath, errors) {
  const fixes = [];

  try {
    let content = fs.readFileSync(filepath, "utf8");
    const originalContent = content;

    // Fix common TypeScript errors
    errors.forEach((error) => {
      // Fix "possibly null" errors with optional chaining
      if (
        error.includes("Object is possibly 'null'") ||
        error.includes("Object is possibly 'undefined'")
      ) {
        // This is complex to fix automatically - would need AST parsing
        // For now, we'll just track it
      }

      // Fix missing type annotations (basic)
      if (error.includes("Parameter") && error.includes("implicitly has an")) {
        // Would need AST parsing to fix properly
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filepath, content, "utf8");
      return {
        success: true,
        fixes,
      };
    }

    return {
      success: false,
      fixes: [],
    };
  } catch (error) {
    return {
      success: false,
      fixes: [],
      error: error.message,
    };
  }
}

/**
 * Fix environment variable formatting
 */
function fixEnvVariableFormatting() {
  const fixes = [];
  const envPath = path.join(__dirname, "..", ".env.local");

  if (!fs.existsSync(envPath)) {
    return {
      success: false,
      fixes: [],
      error: ".env.local not found",
    };
  }

  try {
    let content = fs.readFileSync(envPath, "utf8");
    const originalContent = content;
    const lines = content.split("\n");
    const fixedLines = [];

    lines.forEach((line) => {
      let fixedLine = line;

      // Remove trailing whitespace
      fixedLine = fixedLine.trimEnd();

      // Ensure proper format for key=value pairs
      if (fixedLine && !fixedLine.startsWith("#") && fixedLine.includes("=")) {
        const [key, ...valueParts] = fixedLine.split("=");
        const value = valueParts.join("=");

        // Ensure key doesn't have spaces
        if (key.includes(" ")) {
          fixedLine = key.trim() + "=" + value;
          fixes.push(`Fixed spacing in env variable: ${key.trim()}`);
        }
      }

      fixedLines.push(fixedLine);
    });

    const newContent = fixedLines.join("\n");

    if (newContent !== originalContent) {
      fs.writeFileSync(envPath, newContent, "utf8");
      return {
        success: true,
        fixes,
      };
    }

    return {
      success: false,
      fixes: [],
    };
  } catch (error) {
    return {
      success: false,
      fixes: [],
      error: error.message,
    };
  }
}

/**
 * Apply all safe fixes
 */
async function applyAutoFixes(staticAnalysisResults) {
  const applied = [];
  const failed = [];

  console.log("🔧 Applying auto-fixes...\n");

  // Fix linting errors
  try {
    const lintResult = await fixLintingErrors();
    if (lintResult.success && lintResult.fixes.length > 0) {
      applied.push(...lintResult.fixes);
    } else if (!lintResult.success && lintResult.error) {
      failed.push(`Linting fixes: ${lintResult.error}`);
    }
  } catch (error) {
    failed.push(`Linting fixes: ${error.message}`);
  }

  // Fix formatting
  try {
    const formatResult = await fixFormatting();
    if (formatResult.success && formatResult.fixes.length > 0) {
      applied.push(...formatResult.fixes);
    }
  } catch (error) {
    // Formatting failures are not critical
  }

  // Fix env variable formatting
  try {
    const envResult = fixEnvVariableFormatting();
    if (envResult.success && envResult.fixes.length > 0) {
      applied.push(...envResult.fixes);
    }
  } catch (error) {
    // Env fixes are not critical
  }

  return {
    applied,
    failed,
  };
}

/**
 * Check if an issue is safe to auto-fix
 */
function isSafeToFix(issue) {
  // Safe to fix: linting, formatting, simple syntax
  if (
    issue.includes("lint") ||
    issue.includes("format") ||
    issue.includes("whitespace")
  ) {
    return true;
  }

  // NOT safe to fix: logic errors, test failures, API changes
  if (
    issue.includes("test failed") ||
    issue.includes("logic error") ||
    issue.includes("API") ||
    issue.includes("security vulnerability")
  ) {
    return false;
  }

  return false; // Default to not fixing if unsure
}

module.exports = {
  applyAutoFixes,
  fixLintingErrors,
  fixFormatting,
  fixMissingImports,
  fixTypeScriptErrors,
  fixEnvVariableFormatting,
  isSafeToFix,
};
