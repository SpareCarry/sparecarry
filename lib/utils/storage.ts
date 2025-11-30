/**
 * Storage utilities for auto-measure preferences
 * Uses AsyncStorage on mobile, localStorage on web
 */

type PhotoPreference = "always" | "never" | "ask";

// Conditional import for AsyncStorage (React Native)
let AsyncStorage: any = null;
if (typeof require !== "undefined") {
  try {
    AsyncStorage = require("@react-native-async-storage/async-storage");
  } catch (e) {
    // AsyncStorage not available (e.g., on web)
  }
}

const PHOTO_PREFERENCE_KEY = "auto-measure-photo-preference";
const AUTO_CAPTURE_ENABLED_KEY = "auto-measure-auto-capture-enabled";

/**
 * Get storage interface (AsyncStorage on mobile, localStorage on web)
 */
function getStorage() {
  if (AsyncStorage) {
    return {
      getItem: async (key: string) => {
        try {
          return await AsyncStorage.getItem(key);
        } catch (e) {
          console.warn("[storage] Error reading from AsyncStorage:", e);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (e) {
          console.warn("[storage] Error writing to AsyncStorage:", e);
        }
      },
    };
  } else if (typeof window !== "undefined" && window.localStorage) {
    return {
      getItem: async (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch (e) {
          console.warn("[storage] Error reading from localStorage:", e);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {
          console.warn("[storage] Error writing to localStorage:", e);
        }
      },
    };
  }
  return null;
}

/**
 * Load photo preference from storage
 */
export async function loadPhotoPreference(): Promise<PhotoPreference> {
  const storage = getStorage();
  if (!storage) return "ask";

  try {
    const value = await storage.getItem(PHOTO_PREFERENCE_KEY);
    if (value === "always" || value === "never" || value === "ask") {
      return value;
    }
  } catch (e) {
    console.warn("[storage] Error loading photo preference:", e);
  }
  return "ask";
}

/**
 * Save photo preference to storage
 */
export async function savePhotoPreference(
  preference: PhotoPreference
): Promise<void> {
  const storage = getStorage();
  if (!storage) return;

  try {
    await storage.setItem(PHOTO_PREFERENCE_KEY, preference);
  } catch (e) {
    console.warn("[storage] Error saving photo preference:", e);
  }
}

/**
 * Load auto-capture enabled preference
 */
export async function loadAutoCaptureEnabled(): Promise<boolean> {
  const storage = getStorage();
  if (!storage) return true; // Default: enabled

  try {
    const value = await storage.getItem(AUTO_CAPTURE_ENABLED_KEY);
    if (value === "false") return false;
    if (value === "true") return true;
  } catch (e) {
    console.warn("[storage] Error loading auto-capture preference:", e);
  }
  return true; // Default: enabled
}

/**
 * Save auto-capture enabled preference
 */
export async function saveAutoCaptureEnabled(enabled: boolean): Promise<void> {
  const storage = getStorage();
  if (!storage) return;

  try {
    await storage.setItem(AUTO_CAPTURE_ENABLED_KEY, enabled ? "true" : "false");
  } catch (e) {
    console.warn("[storage] Error saving auto-capture preference:", e);
  }
}
