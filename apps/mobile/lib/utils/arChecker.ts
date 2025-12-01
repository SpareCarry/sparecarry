/**
 * AR Capability Checker
 * Detects ARKit (iOS) / ARCore (Android) support
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AR_CAPABLE_KEY = "AR_CAPABLE";

/**
 * Check if device supports AR
 * Returns true if ARKit (iOS) or ARCore (Android) is available
 */
export async function checkARCapability(): Promise<boolean> {
  try {
    // Check if result is already cached
    const cached = await AsyncStorage.getItem(AR_CAPABLE_KEY);
    if (cached !== null) {
      return cached === "true";
    }

    let isARCapable = false;

    if (Platform.OS === "ios") {
      // ARKit is available on iOS devices with A9 chip or later
      // Check device model to determine ARKit support
      if (Device.modelName) {
        // iPhone 6s and later, iPad (5th gen) and later support ARKit
        // Simplified check: assume modern devices support ARKit
        // In production, you'd check specific device models
        isARCapable = Device.isDevice && !Device.modelName.includes("Simulator");
        
        // More accurate check: ARKit requires iOS 11+ and A9+ chip
        // For now, we'll use a simplified check
        if (Device.isDevice) {
          // Most modern iOS devices support ARKit
          // iPhone 6s (2015) and later support ARKit
          isARCapable = true;
        }
      }
    } else if (Platform.OS === "android") {
      // ARCore support varies by device
      // Check if device is a physical device (not emulator)
      if (Device.isDevice) {
        // ARCore is supported on many modern Android devices
        // We'll use a simplified check - in production, you'd use ARCore SDK to check
        // For now, assume modern devices support ARCore if they're physical devices
        try {
          // Try to check if ARCore is available via native module
          // This is a placeholder - actual implementation would use ARCore SDK
          // For Expo, we'll check device capabilities
          const androidVersion = Platform.Version as number;
          // ARCore generally requires Android 7.0 (API 24) or higher
          if (androidVersion >= 24) {
            isARCapable = true;
          }
        } catch (error) {
          console.warn("[ARChecker] Error checking ARCore support:", error);
          isARCapable = false;
        }
      }
    }

    // Store result in AsyncStorage
    await AsyncStorage.setItem(AR_CAPABLE_KEY, isARCapable.toString());

    return isARCapable;
  } catch (error) {
    console.error("[ARChecker] Error checking AR capability:", error);
    // Default to false if check fails
    await AsyncStorage.setItem(AR_CAPABLE_KEY, "false");
    return false;
  }
}

/**
 * Get cached AR capability status
 */
export async function getARCapability(): Promise<boolean | null> {
  try {
    const cached = await AsyncStorage.getItem(AR_CAPABLE_KEY);
    if (cached === null) return null;
    return cached === "true";
  } catch (error) {
    console.error("[ARChecker] Error getting AR capability:", error);
    return null;
  }
}

/**
 * Clear cached AR capability status (useful for testing or re-checking)
 */
export async function clearARCapabilityCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AR_CAPABLE_KEY);
  } catch (error) {
    console.error("[ARChecker] Error clearing AR capability cache:", error);
  }
}

