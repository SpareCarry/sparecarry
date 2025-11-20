#!/usr/bin/env node

/**
 * Version Bump Script
 * 
 * Automatically bumps version in package.json and creates a git tag
 * Usage: node scripts/version-bump.js [major|minor|patch]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const VERSION_TYPE = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(VERSION_TYPE)) {
  console.error('Invalid version type. Use: major, minor, or patch');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
const currentVersion = packageJson.version;

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Bump version
let newVersion;
switch (VERSION_TYPE) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version bumped from ${currentVersion} to ${newVersion}`);

// Create git tag (optional, can be done manually)
const createTag = process.argv[3] !== '--no-tag';
if (createTag) {
  try {
    execSync(`git add ${PACKAGE_JSON}`, { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' });
    console.log(`✅ Created git tag v${newVersion}`);
  } catch (error) {
    console.warn('⚠️  Failed to create git tag. You may need to commit and tag manually.');
  }
}

console.log(`\n📦 New version: ${newVersion}`);
console.log(`\nNext steps:`);
console.log(`  1. Review changes: git diff`);
console.log(`  2. Push tag: git push origin v${newVersion}`);
console.log(`  3. Create release notes`);

