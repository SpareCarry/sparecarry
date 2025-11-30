const fs = require("fs");
const path = require("path");

// Find nanoid in both main node_modules and pnpm store
const nodeModulesPath = path.join(process.cwd(), "node_modules");
const esmPath = path.join(nodeModulesPath, "nanoid", "index.js");
const cjsPath = path.join(nodeModulesPath, "nanoid", "index.cjs");

function patchESModule(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, "utf8");

  // Check if generate is already exported in ES module syntax
  if (!content.includes("export { nanoid as generate")) {
    // Replace the export line to include generate
    content = content.replace(
      /export \{ nanoid, customAlphabet, customRandom, urlAlphabet, random \}/,
      "export { nanoid as generate, nanoid, customAlphabet, customRandom, urlAlphabet, random }"
    );

    // Remove any old CommonJS-style patches
    content = content.replace(/\nif \(!exports\.generate\).*$/m, "");
    content = content.replace(/\n\/\/ Patch for Next\.js.*$/m, "");

    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function patchCommonJS(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, "utf8");

  // Check if generate is already exported
  if (!content.includes("generate: nanoid")) {
    content = content.replace(
      /module\.exports = \{ nanoid, customAlphabet, customRandom, urlAlphabet, random \}/,
      "module.exports = { nanoid, generate: nanoid, customAlphabet, customRandom, urlAlphabet, random }"
    );

    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

console.log("Patching nanoid...");

const esmPatched = patchESModule(esmPath);
const cjsPatched = patchCommonJS(cjsPath);

// Also patch in pnpm store
const pnpmStorePath = path.join(
  nodeModulesPath,
  ".pnpm",
  "nanoid@3.3.7",
  "node_modules",
  "nanoid"
);
const pnpmEsmPath = path.join(pnpmStorePath, "index.js");
const pnpmCjsPath = path.join(pnpmStorePath, "index.cjs");

patchESModule(pnpmEsmPath);
patchCommonJS(pnpmCjsPath);

if (esmPatched || cjsPatched) {
  console.log("✅ Patched nanoid to export generate");
} else {
  console.log("✅ nanoid already has generate export");
}
