/**
 * Device Capability Detector
 * Detects device performance to determine optimal detection method
 * Checks RAM, CPU cores, and device age at app startup
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CAPABILITY_CACHE_KEY = "AUTO_MEASURE_DEVICE_CAPABILITY";
const CAPABILITY_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export type DetectionCapability = "simple" | "enhanced";

interface CapabilityResult {
  capability: DetectionCapability;
  timestamp: number;
  reason: string;
}

/**
 * Check device capability for auto-measure detection
 * Returns "simple" for edge detection or "enhanced" for ML model
 */
export async function checkDeviceCapability(): Promise<DetectionCapability> {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(CAPABILITY_CACHE_KEY);
    if (cached) {
      try {
        const result: CapabilityResult = JSON.parse(cached);
        const age = Date.now() - result.timestamp;
        
        // Use cached result if less than 7 days old
        if (age < CAPABILITY_CACHE_EXPIRY) {
          console.log("[DeviceCapability] Using cached capability:", result.capability, result.reason);
          return result.capability;
        }
      } catch (e) {
        // Invalid cache, continue to fresh check
        console.warn("[DeviceCapability] Invalid cache, rechecking");
      }
    }

    // Perform fresh capability check
    const capability = await performCapabilityCheck();
    
    // Cache the result
    const result: CapabilityResult = {
      capability,
      timestamp: Date.now(),
      reason: getCapabilityReason(capability),
    };
    
    await AsyncStorage.setItem(CAPABILITY_CACHE_KEY, JSON.stringify(result));
    console.log("[DeviceCapability] Detected capability:", capability, result.reason);
    
    return capability;
  } catch (error) {
    console.error("[DeviceCapability] Error checking capability:", error);
    // Default to simple on error (safer, works on all devices)
    return "simple";
  }
}

/**
 * Perform actual capability check
 */
async function performCapabilityCheck(): Promise<DetectionCapability> {
  // Check if running on physical device
  if (!Device.isDevice) {
    console.log("[DeviceCapability] Simulator/emulator detected, using simple mode");
    return "simple";
  }

  // Get device info
  const deviceYear = Device.deviceYearClass || 0;
  const totalMemory = Device.totalMemory || 0;
  const osVersion = Platform.Version;

  // Check device age (year class)
  // Device year class represents the year the device was released
  // Newer devices (2020+) are more likely to handle ML models well
  const isRecentDevice = deviceYear >= 2020;
  
  // Check memory
  // ML models need at least 2GB RAM for smooth operation
  // 2GB = 2 * 1024 * 1024 * 1024 bytes
  const hasEnoughMemory = totalMemory >= 2 * 1024 * 1024 * 1024;
  
  // Check OS version
  // Android: API 26+ (Android 8.0+)
  // iOS: iOS 12+ (already handled by deviceYearClass)
  const isModernOS = Platform.OS === "ios" || (typeof osVersion === "number" && osVersion >= 26);

  // Decision logic
  if (isRecentDevice && hasEnoughMemory && isModernOS) {
    // High-end device: use ML model
    return "enhanced";
  } else if (deviceYear >= 2018 && hasEnoughMemory) {
    // Mid-range device: could use ML but edge detection is safer
    // For now, use simple to ensure smooth performance
    return "simple";
  } else {
    // Older or low-memory device: use simple edge detection
    return "simple";
  }
}

/**
 * Get human-readable reason for capability decision
 */
function getCapabilityReason(capability: DetectionCapability): string {
  if (capability === "enhanced") {
    return "Recent device with sufficient memory for ML model";
  } else {
    return "Using edge detection for optimal performance";
  }
}

/**
 * Get cached capability without performing check
 */
export async function getCachedCapability(): Promise<DetectionCapability | null> {
  try {
    const cached = await AsyncStorage.getItem(CAPABILITY_CACHE_KEY);
    if (!cached) return null;
    
    const result: CapabilityResult = JSON.parse(cached);
    const age = Date.now() - result.timestamp;
    
    if (age < CAPABILITY_CACHE_EXPIRY) {
      return result.capability;
    }
    
    return null;
  } catch (error) {
    console.error("[DeviceCapability] Error getting cached capability:", error);
    return null;
  }
}

/**
 * Clear capability cache (useful for testing or re-checking)
 */
export async function clearCapabilityCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CAPABILITY_CACHE_KEY);
    console.log("[DeviceCapability] Cache cleared");
  } catch (error) {
    console.error("[DeviceCapability] Error clearing cache:", error);
  }
}

/**
 * Force capability check (ignores cache)
 */
export async function forceCapabilityCheck(): Promise<DetectionCapability> {
  await clearCapabilityCache();
  return checkDeviceCapability();
}

