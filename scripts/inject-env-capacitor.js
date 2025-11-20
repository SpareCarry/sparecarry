/**
 * Inject environment variables into Capacitor config
 * 
 * This script reads environment variables and injects them into
 * the Capacitor build for mobile apps
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.staging');
const CAPACITOR_CONFIG = path.join(__dirname, '..', 'capacitor.config.ts');

// Read environment variables
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Environment file not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

// Get environment from command line or default to staging
const envName = process.argv[2] || 'staging';
const envFile = envName === 'production' 
  ? path.join(__dirname, '..', '.env.production')
  : path.join(__dirname, '..', '.env.staging');

const env = loadEnvFile(envFile);

// Read Capacitor config
let configContent = fs.readFileSync(CAPACITOR_CONFIG, 'utf-8');

// Inject environment variables as plugin config
const envVars = {
  NEXT_PUBLIC_APP_ENV: env.NEXT_PUBLIC_APP_ENV || envName,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL || '',
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN || '',
  NEXT_PUBLIC_UNLEASH_URL: env.NEXT_PUBLIC_UNLEASH_URL || '',
  NEXT_PUBLIC_UNLEASH_CLIENT_KEY: env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY || '',
};

// Add environment variables to Capacitor config
const envConfigString = JSON.stringify(envVars, null, 2);

// Check if env plugin already exists
if (configContent.includes('Environment')) {
  // Update existing Environment plugin
  configContent = configContent.replace(
    /plugins:\s*\{[\s\S]*?Environment:\s*\{[\s\S]*?\},/,
    `plugins: {
    Environment: {
      variables: ${envConfigString},
    },`
  );
} else {
  // Add Environment plugin before closing plugins object
  configContent = configContent.replace(
    /(\s+)(LocalNotifications:[\s\S]*?),\s*(\n\s+\}),/,
    `$1LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#14b8a6",
      sound: "foghorn.wav",
    },
    Environment: {
      variables: ${envConfigString},
    },
$3,`
  );
}

// Write updated config
fs.writeFileSync(CAPACITOR_CONFIG, configContent, 'utf-8');

console.log(`✅ Injected ${envName} environment variables into Capacitor config`);
console.log(`   Environment: ${envVars.NEXT_PUBLIC_APP_ENV}`);
console.log(`   App URL: ${envVars.NEXT_PUBLIC_APP_URL}`);

