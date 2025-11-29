// Temporary diagnostic file to check React resolution
// This will be removed after diagnosis

const reactPath = require.resolve('react');
const react = require('react');
const reactNativePath = require.resolve('react-native');

// Also resolve JSX runtimes – these can be a second entry-point for React
let jsxRuntimePath = null;
let jsxDevRuntimePath = null;

try {
  jsxRuntimePath = require.resolve('react/jsx-runtime');
} catch (e) {
  // ignore – older Reacts or unusual setups may not have this
}

try {
  jsxDevRuntimePath = require.resolve('react/jsx-dev-runtime');
} catch (e) {
  // ignore
}

console.log('=== REACT RESOLUTION CHECK ===');
console.log('React resolved from:', reactPath);
console.log('React Native resolved from:', reactNativePath);
if (jsxRuntimePath) {
  console.log('React JSX runtime resolved from:', jsxRuntimePath);
}
if (jsxDevRuntimePath) {
  console.log('React JSX DEV runtime resolved from:', jsxDevRuntimePath);
}
console.log('React version:', react.version);
console.log('React keys:', Object.keys(react).slice(0, 20).join(', '));

// Check if React is from mobile app's node_modules
const isFromMobileApp = reactPath.includes('apps\\mobile\\node_modules') || reactPath.includes('apps/mobile/node_modules');
console.log('Is React from mobile app node_modules?', isFromMobileApp);

// Set a global marker to detect multiple React instances
if (global.__REACT_SINGLETON_CHECK__) {
  console.error('⚠️ WARNING: Multiple React instances detected!');
  console.error('Previous React path:', global.__REACT_SINGLETON_CHECK__);
  console.error('Current React path:', reactPath);
  if (global.__REACT_JSX_RUNTIME_PATH__ || jsxRuntimePath) {
    console.error(
      'Previous JSX runtime path:',
      global.__REACT_JSX_RUNTIME_PATH__
    );
    console.error('Current JSX runtime path:', jsxRuntimePath);
  }
} else {
  global.__REACT_SINGLETON_CHECK__ = reactPath;
  global.__REACT_JSX_RUNTIME_PATH__ = jsxRuntimePath;
  console.log('✅ React singleton check initialized');
}

module.exports = { reactPath, reactVersion: react.version };

