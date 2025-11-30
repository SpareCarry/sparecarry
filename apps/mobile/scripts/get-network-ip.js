/**
 * Helper script to get your network IP address
 * Run this to find the IP you need for EXPO_PUBLIC_APP_URL
 */

const os = require("os");

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

const addresses = getNetworkIP();

if (addresses.length === 0) {
  console.log("❌ No network IP addresses found.");
  console.log("Make sure you are connected to a network.");
} else {
  console.log("✅ Found network IP addresses:");
  console.log("");
  addresses.forEach(({ interface: name, address }) => {
    console.log(`  ${name}: http://${address}:3000`);
  });
  console.log("");
  console.log("📝 Add this to your .env.local file:");
  console.log(`   EXPO_PUBLIC_APP_URL=http://${addresses[0].address}:3000`);
  console.log("");
  console.log("💡 Make sure your Next.js dev server is running on port 3000");
  console.log("   and that your phone is on the same WiFi network.");
}
