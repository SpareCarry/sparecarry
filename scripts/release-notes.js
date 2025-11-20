#!/usr/bin/env node

/**
 * Release Notes Builder
 * 
 * Generates release notes from git commits
 * Usage: node scripts/release-notes.js [from-tag] [to-tag]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const fromTag = process.argv[2] || 'HEAD~10';
const toTag = process.argv[3] || 'HEAD';

// Get commits
let commits;
try {
  const gitLog = execSync(
    `git log ${fromTag}..${toTag} --pretty=format:"%h|%s|%an" --no-merges`,
    { encoding: 'utf-8' }
  );
  commits = gitLog.trim().split('\n').filter(Boolean);
} catch (error) {
  console.error('Error fetching git commits:', error.message);
  process.exit(1);
}

// Categorize commits
const categories = {
  feat: [],
  fix: [],
  perf: [],
  chore: [],
  docs: [],
  refactor: [],
  other: [],
};

commits.forEach((commit) => {
  const [hash, message, author] = commit.split('|');
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.startsWith('feat:') || lowerMessage.startsWith('feature:')) {
    categories.feat.push({ hash, message, author });
  } else if (lowerMessage.startsWith('fix:') || lowerMessage.startsWith('bugfix:')) {
    categories.fix.push({ hash, message, author });
  } else if (lowerMessage.startsWith('perf:') || lowerMessage.startsWith('performance:')) {
    categories.perf.push({ hash, message, author });
  } else if (lowerMessage.startsWith('chore:')) {
    categories.chore.push({ hash, message, author });
  } else if (lowerMessage.startsWith('docs:') || lowerMessage.startsWith('doc:')) {
    categories.docs.push({ hash, message, author });
  } else if (lowerMessage.startsWith('refactor:')) {
    categories.refactor.push({ hash, message, author });
  } else {
    categories.other.push({ hash, message, author });
  }
});

// Generate markdown
let markdown = `# Release Notes\n\n`;
markdown += `**From:** ${fromTag}\n`;
markdown += `**To:** ${toTag}\n`;
markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

if (categories.feat.length > 0) {
  markdown += `## ✨ Features\n\n`;
  categories.feat.forEach(({ message }) => {
    markdown += `- ${message.replace(/^(feat|feature):\s*/i, '')}\n`;
  });
  markdown += `\n`;
}

if (categories.fix.length > 0) {
  markdown += `## 🐛 Bug Fixes\n\n`;
  categories.fix.forEach(({ message }) => {
    markdown += `- ${message.replace(/^(fix|bugfix):\s*/i, '')}\n`;
  });
  markdown += `\n`;
}

if (categories.perf.length > 0) {
  markdown += `## ⚡ Performance\n\n`;
  categories.perf.forEach(({ message }) => {
    markdown += `- ${message.replace(/^(perf|performance):\s*/i, '')}\n`;
  });
  markdown += `\n`;
}

if (categories.refactor.length > 0) {
  markdown += `## 🔧 Refactoring\n\n`;
  categories.refactor.forEach(({ message }) => {
    markdown += `- ${message.replace(/^refactor:\s*/i, '')}\n`;
  });
  markdown += `\n`;
}

if (categories.docs.length > 0) {
  markdown += `## 📚 Documentation\n\n`;
  categories.docs.forEach(({ message }) => {
    markdown += `- ${message.replace(/^(docs|doc):\s*/i, '')}\n`;
  });
  markdown += `\n`;
}

if (categories.chore.length > 0) {
  markdown += `## 🧹 Chores\n\n`;
  categories.chore.forEach(({ message }) => {
    markdown += `- ${message.replace(/^chore:\s*/i, '')}\n`;
  });
  markdown += `\n`;
}

if (categories.other.length > 0) {
  markdown += `## 📝 Other Changes\n\n`;
  categories.other.forEach(({ message }) => {
    markdown += `- ${message}\n`;
  });
  markdown += `\n`;
}

// Write to file
const outputPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');
fs.writeFileSync(outputPath, markdown);

console.log(`✅ Release notes generated: ${outputPath}`);
console.log(`\n${markdown}`);

