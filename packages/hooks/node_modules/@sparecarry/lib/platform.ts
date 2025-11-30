/**
 * Platform detection utilities
 * Works for both web and native (Expo) environments
 */

// More reliable Expo detection - check for React Native environment first
function isExpo(): boolean {
  // In React Native/Expo, window might not exist or might be different
  // Check for React Native environment indicators
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return true;
  }

  // Check for Expo-specific globals
  if (typeof global !== "undefined") {
    if ((global as any).__expo || (global as any).expo) {
      return true;
    }
  }

  // Check for window-based Expo indicators
  if (typeof window !== "undefined") {
    if ((window as any).__expo || (window as any).expo) {
      return true;
    }
    // Check for Expo Go user agent
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      if (
        navigator.userAgent.includes("Expo") ||
        navigator.userAgent.includes("expo")
      ) {
        return true;
      }
    }
  }

  return false;
}

function isCapacitor(): boolean {
  if (typeof window !== "undefined") {
    return !!(window as any).Capacitor;
  }
  return false;
}

// Determine platform - prioritize React Native detection
export const isMobile = (() => {
  // React Native environment
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return true;
  }
  // Expo detection
  if (isExpo()) {
    return true;
  }
  // Capacitor detection
  if (isCapacitor()) {
    return true;
  }
  return false;
})();

export const isWeb = !isMobile && typeof window !== "undefined";
export const isAndroid =
  isMobile &&
  typeof navigator !== "undefined" &&
  /android/i.test(navigator.userAgent);
export const isIOS =
  isMobile &&
  !isAndroid &&
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);
