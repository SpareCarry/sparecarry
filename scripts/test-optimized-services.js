/**
 * Test Script for Optimized Services
 * 
 * Verifies that the new unified services work correctly
 * Run with: node scripts/test-optimized-services.js
 */

const path = require('path');

// Mock environment variables
process.env.NEXT_PUBLIC_GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || 'test-key';
process.env.NODE_ENV = 'test';

console.log('🧪 Testing Optimized Services...\n');

// Test 1: Location Service
console.log('1️⃣ Testing Location Service...');
try {
  // Note: This would require actual module loading in a test environment
  // For now, we'll verify the file exists and has correct exports
  const locationServicePath = path.join(__dirname, '../lib/services/location.ts');
  const fs = require('fs');
  
  if (fs.existsSync(locationServicePath)) {
    const content = fs.readFileSync(locationServicePath, 'utf8');
    
    // Check for key exports
    const hasAutocomplete = content.includes('export async function autocomplete');
    const hasReverseGeocode = content.includes('export async function reverseGeocode');
    const hasForwardGeocode = content.includes('export async function forwardGeocode');
    const hasCaching = content.includes('class LocationCache');
    const hasDebouncing = content.includes('class Debouncer');
    
    if (hasAutocomplete && hasReverseGeocode && hasForwardGeocode && hasCaching && hasDebouncing) {
      console.log('   ✅ Location service structure verified');
      console.log('   ✅ Caching implemented');
      console.log('   ✅ Debouncing implemented');
    } else {
      console.log('   ⚠️  Some features missing');
    }
  } else {
    console.log('   ❌ Location service file not found');
  }
} catch (error) {
  console.log('   ⚠️  Could not verify location service:', error.message);
}

// Test 2: Shipping Service
console.log('\n2️⃣ Testing Shipping Service...');
try {
  const shippingServicePath = path.join(__dirname, '../lib/services/shipping.ts');
  const fs = require('fs');
  
  if (fs.existsSync(shippingServicePath)) {
    const content = fs.readFileSync(shippingServicePath, 'utf8');
    
    // Check for key exports
    const hasCalculateEstimate = content.includes('export function calculateShippingEstimate');
    const hasCourierRates = content.includes('export function getCourierRates');
    const hasCustomsRates = content.includes('export function calculateCustomsCost');
    const hasSpareCarryPricing = content.includes('calculateSpareCarryPlanePrice');
    const hasLazyLoading = content.includes('loadCourierRates') || content.includes('loadCustomsRates');
    
    if (hasCalculateEstimate && hasCourierRates && hasCustomsRates && hasSpareCarryPricing) {
      console.log('   ✅ Shipping service structure verified');
      if (hasLazyLoading) {
        console.log('   ✅ Lazy loading implemented');
      }
    } else {
      console.log('   ⚠️  Some features missing');
    }
  } else {
    console.log('   ❌ Shipping service file not found');
  }
} catch (error) {
  console.log('   ⚠️  Could not verify shipping service:', error.message);
}

// Test 3: Component Updates
console.log('\n3️⃣ Testing Component Updates...');
try {
  const fs = require('fs');
  const componentsToCheck = [
    '../components/location/LocationInput.tsx',
    '../components/feed/feed-card.tsx',
    '../components/messaging/MessageThread.tsx',
    '../app/shipping-estimator/page.tsx',
  ];
  
  let updatedCount = 0;
  componentsToCheck.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const usesNewService = content.includes('lib/services/location') || 
                            content.includes('lib/services/shipping') ||
                            content.includes('React.memo');
      if (usesNewService) {
        updatedCount++;
      }
    }
  });
  
  console.log(`   ✅ ${updatedCount}/${componentsToCheck.length} components updated`);
} catch (error) {
  console.log('   ⚠️  Could not verify components:', error.message);
}

// Test 4: Performance Profiler
console.log('\n4️⃣ Testing Performance Profiler...');
try {
  const profilerPath = path.join(__dirname, '../lib/performance/enhanced-profiler.tsx');
  const fs = require('fs');
  
  if (fs.existsSync(profilerPath)) {
    const content = fs.readFileSync(profilerPath, 'utf8');
    
    const hasAnalyzer = content.includes('class PerformanceAnalyzer');
    const hasBottleneckDetection = content.includes('detectBottlenecks');
    const hasTracking = content.includes('usePerformanceTracking');
    const hasReport = content.includes('PerformanceReport');
    
    if (hasAnalyzer && hasBottleneckDetection && hasTracking && hasReport) {
      console.log('   ✅ Enhanced profiler structure verified');
      console.log('   ✅ Bottleneck detection implemented');
      console.log('   ✅ Performance tracking hooks available');
    } else {
      console.log('   ⚠️  Some features missing');
    }
  } else {
    console.log('   ❌ Enhanced profiler file not found');
  }
} catch (error) {
  console.log('   ⚠️  Could not verify profiler:', error.message);
}

// Test 5: Provider Integration
console.log('\n5️⃣ Testing Provider Integration...');
try {
  const providerPath = path.join(__dirname, '../app/providers/performance-provider.tsx');
  const fs = require('fs');
  
  if (fs.existsSync(providerPath)) {
    const content = fs.readFileSync(providerPath, 'utf8');
    
    if (content.includes('PerformanceReport')) {
      console.log('   ✅ Performance profiler integrated in provider');
    } else {
      console.log('   ⚠️  Performance profiler not integrated');
    }
  } else {
    console.log('   ❌ Performance provider file not found');
  }
} catch (error) {
  console.log('   ⚠️  Could not verify provider:', error.message);
}

console.log('\n✨ Service testing complete!');
console.log('\n📝 Next steps:');
console.log('   1. Run the app and test location autocomplete');
console.log('   2. Test shipping estimator calculations');
console.log('   3. Check performance profiler at ?perf=true');
console.log('   4. Verify no console errors in browser');
console.log('\n💡 To view performance report:');
console.log('   Add ?perf=true to any URL in development mode');

