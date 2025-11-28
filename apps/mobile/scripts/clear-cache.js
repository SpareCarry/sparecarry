/**
 * Clear Metro bundler cache for pnpm workspace
 * Works on both Windows and Unix
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Metro bundler cache...');

const dirsToRemove = [
  path.join(__dirname, '..', '.expo'),
  path.join(__dirname, '..', 'node_modules', '.cache'),
  path.join(__dirname, '..', '..', '..', 'node_modules', '.cache'),
];

dirsToRemove.forEach((dir) => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed: ${path.relative(process.cwd(), dir)}`);
    } catch (error) {
      console.warn(`⚠️  Could not remove: ${dir}`, error.message);
    }
  }
});

console.log('');
console.log('✅ Cache cleared!');
console.log('Now run: pnpm start:clear');

