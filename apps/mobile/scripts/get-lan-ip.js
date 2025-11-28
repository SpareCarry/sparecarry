/**
 * Script to get your local network IP address
 * Run this to find your laptop's IP for mobile testing
 */

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Look for IPv4 addresses that aren't localhost
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

const ip = getLocalIP();

if (ip) {
  console.log('');
  console.log('========================================');
  console.log('📡 YOUR LOCAL NETWORK IP ADDRESS');
  console.log('========================================');
  console.log('');
  console.log(`IP: ${ip}`);
  console.log('');
  console.log('Add this to apps/mobile/.env.local:');
  console.log(`EXPO_PUBLIC_LAN_IP=${ip}`);
  console.log('');
  console.log('This allows mobile devices to connect to your');
  console.log('development server when testing on the same network.');
  console.log('');
} else {
  console.error('Could not detect local IP address');
  console.error('Make sure you\'re connected to a network');
}

