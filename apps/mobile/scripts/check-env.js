/**
 * Check if required environment variables are set
 */

console.log("🔍 Checking environment variables...\n");

const requiredVars = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
];

const missing = [];
const present = [];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    missing.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  } else {
    present.push(varName);
    // Show first/last few chars for security
    const preview =
      value.length > 20
        ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
        : "***";
    console.log(`✅ ${varName}: SET (${preview})`);
  }
});

console.log("");

if (missing.length > 0) {
  console.error("❌ Missing required environment variables!");
  console.error("");
  console.error("Create a .env file in apps/mobile/ with:");
  console.error("");
  missing.forEach((varName) => {
    console.error(`${varName}=your_value_here`);
  });
  console.error("");
  console.error("Or set them in your shell before running:");
  console.error(`export ${missing.join("=value ")}`);
  process.exit(1);
} else {
  console.log("✅ All required environment variables are set!");
  process.exit(0);
}
