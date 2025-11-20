#!/usr/bin/env node

/**
 * Mobile Build Verification Script
 * 
 * Validates iOS IPA and Android AAB files
 * Checks version numbers, signing, and environment variables
 * 
 * Usage:
 *   node scripts/verify-mobile-build.js ios path/to/app.ipa
 *   node scripts/verify-mobile-build.js android path/to/app.aab
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createHash } = require('crypto');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let errors = [];
let warnings = [];
let passed = [];

function validate(name, condition, errorMsg, warningMsg) {
  if (condition) {
    passed.push(name);
    console.log(`${colors.green}✅${colors.reset} ${name}`);
  } else if (errorMsg) {
    errors.push({ name, message: errorMsg });
    console.log(`${colors.red}❌${colors.reset} ${name}: ${errorMsg}`);
  } else if (warningMsg) {
    warnings.push({ name, message: warningMsg });
    console.log(`${colors.yellow}⚠️${colors.reset} ${name}: ${warningMsg}`);
  }
}

function validateIOS(ipaPath) {
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}iOS IPA Verification${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Check file exists
  if (!fs.existsSync(ipaPath)) {
    console.error(`${colors.red}❌ IPA file not found: ${ipaPath}${colors.reset}`);
    process.exit(1);
  }

  validate('IPA file exists', fs.existsSync(ipaPath), null, null);

  // Extract IPA (it's a zip file)
  const tempDir = path.join(__dirname, '..', '.verify-temp');
  const extractDir = path.join(tempDir, 'ipa-extract');

  try {
    // Clean up previous extraction
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // Unzip IPA
    try {
      execSync(`unzip -q "${ipaPath}" -d "${extractDir}"`, { stdio: 'ignore' });
    } catch {
      // Try with PowerShell on Windows
      execSync(`powershell -Command "Expand-Archive -Path '${ipaPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'ignore' });
    }

    // Find Payload directory
    const payloadDir = path.join(extractDir, 'Payload');
    if (!fs.existsSync(payloadDir)) {
      validate('IPA structure', false, 'Payload directory not found in IPA', null);
      return;
    }

    // Find .app bundle
    const appBundles = fs.readdirSync(payloadDir).filter(f => f.endsWith('.app'));
    if (appBundles.length === 0) {
      validate('App bundle', false, 'No .app bundle found in Payload', null);
      return;
    }

    const appBundle = path.join(payloadDir, appBundles[0]);
    const infoPlistPath = path.join(appBundle, 'Info.plist');

    validate('Info.plist exists', fs.existsSync(infoPlistPath), 'Info.plist not found', null);

    if (!fs.existsSync(infoPlistPath)) {
      return;
    }

    // Parse Info.plist (binary plist, need plutil or plistutil)
    let plistData = {};
      try {
        // Try plutil (macOS)
        const plistJson = execSync(`plutil -convert json -o - "${infoPlistPath}"`, { encoding: 'utf-8' });
        plistData = JSON.parse(plistJson);
      } catch {
        try {
          // Fallback: try to read as text and parse manually
          const plistText = fs.readFileSync(infoPlistPath, 'utf-8');
          // Simple regex extraction for key values
          const bundleIdMatch = plistText.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
          const versionMatch = plistText.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
          const buildMatch = plistText.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/);

          if (bundleIdMatch) plistData.CFBundleIdentifier = bundleIdMatch[1];
          if (versionMatch) plistData.CFBundleShortVersionString = versionMatch[1];
          if (buildMatch) plistData.CFBundleVersion = buildMatch[1];
        } catch {
          // Binary plist, need plutil or other tool
          console.log(`${colors.yellow}⚠️  Cannot parse binary plist without plutil${colors.reset}`);
        }
      }

    // Validate bundle identifier
    const bundleId = plistData.CFBundleIdentifier || plistData['CFBundleIdentifier'];
    if (bundleId) {
      const isStaging = bundleId.endsWith('.staging');
      validate(
        'Bundle ID for staging',
        isStaging,
        `Bundle ID should end with ".staging" for staging builds, got: ${bundleId}`,
        `Bundle ID: ${bundleId} (not staging)`
      );
    } else {
      validate('Bundle ID', false, 'CFBundleIdentifier not found', null);
    }

    // Validate version
    const version = plistData.CFBundleShortVersionString || plistData['CFBundleShortVersionString'];
    const build = plistData.CFBundleVersion || plistData['CFBundleVersion'];

    validate('Version string exists', !!version, 'CFBundleShortVersionString not found', null);
    validate('Build number exists', !!build, 'CFBundleVersion not found', null);

    if (version) {
      console.log(`   Version: ${version}`);
    }
    if (build) {
      console.log(`   Build: ${build}`);
    }

    // Check for staging suffix in version
    if (version && version.includes('-staging')) {
      validate('Version has staging suffix', true, null, null);
    }

    // Check embedded.mobileprovision (provisioning profile)
    const mobileProvisionPath = path.join(appBundle, 'embedded.mobileprovision');
    if (fs.existsSync(mobileProvisionPath)) {
      validate('Provisioning profile exists', true, null, null);
      
      try {
        const provisionText = fs.readFileSync(mobileProvisionPath, 'utf-8');
        // Extract provisioning profile info
        const teamIdMatch = provisionText.match(/TeamIdentifier.*?<array>.*?<string>([^<]+)<\/string>/s);
        const profileNameMatch = provisionText.match(/Name.*?<string>([^<]+)<\/string>/);
        const profileTypeMatch = provisionText.match(/ProvisionedDevices/);

        if (teamIdMatch) {
          console.log(`   Team ID: ${teamIdMatch[1]}`);
        }
        if (profileNameMatch) {
          console.log(`   Profile: ${profileNameMatch[1]}`);
        }
        if (profileTypeMatch) {
          validate('Provisioning profile type', true, null, 'Development/Adhoc profile detected');
        } else {
          validate('Provisioning profile type', true, null, 'App Store/Enterprise profile');
        }
      } catch {
        validate('Provisioning profile readable', false, 'Cannot read provisioning profile', null);
      }
    } else {
      validate('Provisioning profile', false, 'embedded.mobileprovision not found', null);
    }

    // Check for environment variables in app bundle
    // Look for config files or embedded strings
    const configFiles = [
      path.join(appBundle, 'config.json'),
      path.join(appBundle, 'capacitor.config.json'),
    ];

    let envVarsFound = false;
    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        try {
          const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
          if (config.APP_ENV === 'staging' || config.NEXT_PUBLIC_APP_ENV === 'staging') {
            envVarsFound = true;
            validate('Environment variables embedded', true, null, null);
            console.log(`   APP_ENV: ${config.APP_ENV || config.NEXT_PUBLIC_APP_ENV}`);
          }
        } catch {
          // Not JSON or can't parse
        }
      }
    }

    if (!envVarsFound) {
      validate('Environment variables embedded', false, 'Staging environment variables not found in app bundle', null);
    }

    // Check code signing
    try {
      const codesignOutput = execSync(`codesign -dv "${appBundle}" 2>&1`, { encoding: 'utf-8' });
      if (codesignOutput.includes('Authority=')) {
        validate('Code signing', true, null, null);
        // Extract authority
        const authorityMatch = codesignOutput.match(/Authority=([^\s]+)/);
        if (authorityMatch) {
          console.log(`   Signing Authority: ${authorityMatch[1]}`);
        }
      } else {
        validate('Code signing', false, 'Code signing verification failed', null);
      }
    } catch {
      validate('Code signing', false, 'Cannot verify code signing (codesign not available)', null);
    }

    // Cleanup
    fs.rmSync(extractDir, { recursive: true, force: true });

  } catch (error) {
    console.error(`${colors.red}Error verifying IPA: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function validateAndroid(aabPath) {
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Android AAB Verification${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Check file exists
  if (!fs.existsSync(aabPath)) {
    console.error(`${colors.red}❌ AAB file not found: ${aabPath}${colors.reset}`);
    process.exit(1);
  }

  validate('AAB file exists', fs.existsSync(aabPath), null, null);

  // AAB is a zip file
  const tempDir = path.join(__dirname, '..', '.verify-temp');
  const extractDir = path.join(tempDir, 'aab-extract');

  try {
    // Clean up previous extraction
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // Unzip AAB
    try {
      execSync(`unzip -q "${aabPath}" -d "${extractDir}"`, { stdio: 'ignore' });
    } catch {
      // Try with PowerShell on Windows
      execSync(`powershell -Command "Expand-Archive -Path '${aabPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'ignore' });
    }

    // Find AndroidManifest.xml (in base/manifest/AndroidManifest.xml)
    const manifestPath = path.join(extractDir, 'base', 'manifest', 'AndroidManifest.xml');
    const altManifestPath = path.join(extractDir, 'manifest', 'AndroidManifest.xml');

    let manifestPathFound = manifestPath;
    if (!fs.existsSync(manifestPathFound)) {
      manifestPathFound = altManifestPath;
    }

    validate('AndroidManifest.xml exists', fs.existsSync(manifestPathFound), 'AndroidManifest.xml not found', null);

    if (!fs.existsSync(manifestPathFound)) {
      return;
    }

    // Parse AndroidManifest.xml (binary XML, need aapt2 or axml2xml)
    let manifestData = {};
    try {
      // Try aapt2 dump (Android SDK)
      const aaptOutput = execSync(`aapt2 dump badging "${aabPath}"`, { encoding: 'utf-8' });
      const packageMatch = aaptOutput.match(/package: name='([^']+)'/);
      const versionCodeMatch = aaptOutput.match(/versionCode='([^']+)'/);
      const versionNameMatch = aaptOutput.match(/versionName='([^']+)'/);

      if (packageMatch) manifestData.package = packageMatch[1];
      if (versionCodeMatch) manifestData.versionCode = versionCodeMatch[1];
      if (versionNameMatch) manifestData.versionName = versionNameMatch[1];
    } catch {
      // Fallback: try to read as text (might be binary)
      try {
        const manifestText = fs.readFileSync(manifestPathFound, 'utf-8');
        const packageMatch = manifestText.match(/package="([^"]+)"/);
        const versionCodeMatch = manifestText.match(/android:versionCode="([^"]+)"/);
        const versionNameMatch = manifestText.match(/android:versionName="([^"]+)"/);

        if (packageMatch) manifestData.package = packageMatch[1];
        if (versionCodeMatch) manifestData.versionCode = versionCodeMatch[1];
        if (versionNameMatch) manifestData.versionName = versionNameMatch[1];
      } catch {
        // Binary XML, need aapt2
        validate('AndroidManifest.xml readable', false, 'Cannot parse AndroidManifest.xml (binary format, need aapt2)', null);
      }
    }

    // Validate package name
    const packageName = manifestData.package;
    if (packageName) {
      const isStaging = packageName.endsWith('.staging');
      validate(
        'Package name for staging',
        isStaging,
        `Package name should end with ".staging" for staging builds, got: ${packageName}`,
        `Package name: ${packageName} (not staging)`
      );
      console.log(`   Package: ${packageName}`);
    } else {
      validate('Package name', false, 'Package name not found', null);
    }

    // Validate version
    validate('Version code exists', !!manifestData.versionCode, 'versionCode not found', null);
    validate('Version name exists', !!manifestData.versionName, 'versionName not found', null);

    if (manifestData.versionCode) {
      console.log(`   Version Code: ${manifestData.versionCode}`);
    }
    if (manifestData.versionName) {
      console.log(`   Version Name: ${manifestData.versionName}`);
      if (manifestData.versionName.includes('-staging')) {
        validate('Version has staging suffix', true, null, null);
      }
    }

    // Check for BuildConfig (environment variables)
    // Look in base/dex/classes.dex or base/resources.pb
    const resourcesPath = path.join(extractDir, 'base', 'resources.pb');
    const dexPath = path.join(extractDir, 'base', 'dex', 'classes.dex');

    // Try to decompile and verify BuildConfig if jadx is available
    let jadxAvailable = false;
    try {
      execSync('jadx --version', { stdio: 'ignore' });
      jadxAvailable = true;
    } catch {
      // jadx not available
    }

    if (jadxAvailable && fs.existsSync(dexPath)) {
      console.log(`${colors.cyan}Decompiling AAB with jadx to verify BuildConfig...${colors.reset}`);
      
      const jadxOutputDir = path.join(extractDir, 'jadx-output');
      try {
        // Decompile with jadx
        execSync(`jadx -d "${jadxOutputDir}" "${aabPath}"`, { stdio: 'ignore' });
        
        // Find BuildConfig.java
        const buildConfigPath = path.join(jadxOutputDir, 'com', 'carryspace', 'app', 'BuildConfig.java');
        const altBuildConfigPath = path.join(jadxOutputDir, 'com', 'carryspace', 'app', 'staging', 'BuildConfig.java');
        
        let buildConfigFile = buildConfigPath;
        if (!fs.existsSync(buildConfigFile)) {
          buildConfigFile = altBuildConfigPath;
        }
        
        if (fs.existsSync(buildConfigFile)) {
          const buildConfigContent = fs.readFileSync(buildConfigFile, 'utf-8');
          
          // Validate BuildConfig fields
          const appEnvMatch = buildConfigContent.match(/APP_ENV\s*=\s*"([^"]+)"/);
          const supabaseUrlMatch = buildConfigContent.match(/SUPABASE_URL\s*=\s*"([^"]+)"/);
          const stripeKeyMatch = buildConfigContent.match(/STRIPE_PUBLISHABLE_KEY\s*=\s*"([^"]+)"/);
          const sentryDsnMatch = buildConfigContent.match(/SENTRY_DSN\s*=\s*"([^"]+)"/);
          const unleashUrlMatch = buildConfigContent.match(/UNLEASH_URL\s*=\s*"([^"]+)"/);
          
          if (appEnvMatch) {
            const appEnv = appEnvMatch[1];
            validate(
              'BuildConfig APP_ENV',
              appEnv === 'staging',
              `APP_ENV should be "staging", got: ${appEnv}`,
              null
            );
            console.log(`   APP_ENV: ${appEnv}`);
          } else {
            validate('BuildConfig APP_ENV', false, 'APP_ENV not found in BuildConfig', null);
          }
          
          if (supabaseUrlMatch) {
            const supabaseUrl = supabaseUrlMatch[1];
            validate(
              'BuildConfig SUPABASE_URL',
              supabaseUrl.length > 0 && supabaseUrl.startsWith('https://'),
              'SUPABASE_URL is empty or invalid',
              null
            );
            console.log(`   SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
          } else {
            validate('BuildConfig SUPABASE_URL', false, 'SUPABASE_URL not found in BuildConfig', null);
          }
          
          if (stripeKeyMatch) {
            const stripeKey = stripeKeyMatch[1];
            validate(
              'BuildConfig STRIPE_PUBLISHABLE_KEY',
              stripeKey.length > 0 && (stripeKey.startsWith('pk_test_') || stripeKey.startsWith('pk_live_')),
              'STRIPE_PUBLISHABLE_KEY is empty or invalid',
              null
            );
            console.log(`   STRIPE_PUBLISHABLE_KEY: ${stripeKey.substring(0, 20)}...`);
          } else {
            validate('BuildConfig STRIPE_PUBLISHABLE_KEY', false, 'STRIPE_PUBLISHABLE_KEY not found in BuildConfig', null);
          }
          
          if (sentryDsnMatch) {
            const sentryDsn = sentryDsnMatch[1];
            validate(
              'BuildConfig SENTRY_DSN',
              sentryDsn.length > 0 && sentryDsn.includes('@'),
              'SENTRY_DSN is empty or invalid',
              null
            );
            console.log(`   SENTRY_DSN: ${sentryDsn.substring(0, 30)}...`);
          } else {
            validate('BuildConfig SENTRY_DSN', false, 'SENTRY_DSN not found in BuildConfig', null);
          }
          
          if (unleashUrlMatch) {
            const unleashUrl = unleashUrlMatch[1];
            validate(
              'BuildConfig UNLEASH_URL',
              unleashUrl.length > 0 && (unleashUrl.startsWith('http://') || unleashUrl.startsWith('https://')),
              'UNLEASH_URL is empty or invalid',
              null
            );
            console.log(`   UNLEASH_URL: ${unleashUrl.substring(0, 30)}...`);
          } else {
            validate('BuildConfig UNLEASH_URL', false, 'UNLEASH_URL not found in BuildConfig', null);
          }
          
          // Cleanup jadx output
          fs.rmSync(jadxOutputDir, { recursive: true, force: true });
        } else {
          validate('BuildConfig.java found', false, 'BuildConfig.java not found after decompilation', null);
        }
      } catch (error) {
        validate('jadx decompilation', false, `Failed to decompile with jadx: ${error.message}`, null);
      }
    } else {
      // Fallback: Check if files exist
      if (fs.existsSync(resourcesPath) || fs.existsSync(dexPath)) {
        if (!jadxAvailable) {
          validate('Build artifacts exist', true, null, 'Environment variables should be in BuildConfig (jadx not installed, cannot verify)');
          console.log(`   ${colors.yellow}⚠️  Install jadx to verify BuildConfig values: brew install jadx (macOS) or download from https://github.com/skylot/jadx${colors.reset}`);
        } else {
          validate('Build artifacts exist', true, null, 'Environment variables should be in BuildConfig');
        }
      } else {
        validate('Build artifacts', false, 'No build artifacts found', null);
      }
    }

    // Check signing (META-INF/)
    const metaInfDir = path.join(extractDir, 'META-INF');
    if (fs.existsSync(metaInfDir)) {
      validate('META-INF exists', true, null, null);
      
      const certFiles = fs.readdirSync(metaInfDir).filter(f => f.endsWith('.RSA') || f.endsWith('.DSA') || f.endsWith('.EC'));
      if (certFiles.length > 0) {
        validate('Signing certificates exist', true, null, null);
        console.log(`   Certificates: ${certFiles.join(', ')}`);
        
        // Try to extract certificate info
        try {
          const certPath = path.join(metaInfDir, certFiles[0]);
          const keytoolOutput = execSync(`keytool -printcert -file "${certPath}"`, { encoding: 'utf-8' });
          const ownerMatch = keytoolOutput.match(/Owner: ([^\n]+)/);
          if (ownerMatch) {
            console.log(`   Certificate Owner: ${ownerMatch[1]}`);
          }
        } catch {
          // keytool not available or can't read
        }
      } else {
        validate('Signing certificates', false, 'No signing certificates found in META-INF', null);
      }
    } else {
      validate('META-INF', false, 'META-INF directory not found (AAB not signed)', null);
    }

    // Cleanup
    fs.rmSync(extractDir, { recursive: true, force: true });

  } catch (error) {
    console.error(`${colors.red}Error verifying AAB: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Main execution
const platform = process.argv[2];
const buildPath = process.argv[3];

if (!platform || !buildPath) {
  console.error(`${colors.red}Usage: node scripts/verify-mobile-build.js [ios|android] <path-to-build-file>${colors.reset}`);
  console.error(`  Example: node scripts/verify-mobile-build.js ios path/to/app.ipa`);
  console.error(`  Example: node scripts/verify-mobile-build.js android path/to/app.aab`);
  process.exit(1);
}

console.log(`${colors.cyan}🔍 Mobile Build Verification${colors.reset}`);
console.log(`${colors.cyan}Platform: ${platform}${colors.reset}`);
console.log(`${colors.cyan}Build: ${buildPath}${colors.reset}\n`);

if (platform === 'ios') {
  validateIOS(buildPath);
} else if (platform === 'android') {
  validateAndroid(buildPath);
} else {
  console.error(`${colors.red}Invalid platform: ${platform}. Use 'ios' or 'android'${colors.reset}`);
  process.exit(1);
}

// Summary
console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}Summary${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}✅ Passed: ${passed.length}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnings.length}${colors.reset}`);
console.log(`${colors.red}❌ Errors: ${errors.length}${colors.reset}\n`);

if (warnings.length > 0) {
  console.log(`${colors.yellow}Warnings:${colors.reset}`);
  warnings.forEach((w) => console.log(`   - ${w.name}: ${w.message}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`${colors.red}Errors (must fix):${colors.reset}`);
  errors.forEach((e) => console.log(`   - ${e.name}: ${e.message}`));
  console.log('');
  process.exit(1);
}

console.log(`${colors.green}✅ Build verification passed!${colors.reset}\n`);
process.exit(0);

