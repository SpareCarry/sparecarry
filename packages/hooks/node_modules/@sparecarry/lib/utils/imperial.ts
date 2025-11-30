/**
 * Imperial Units Conversion Utilities
 */

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function formatWeight(kg: number, preferImperial: boolean): string {
  if (preferImperial) {
    const lbs = kgToLbs(kg);
    return `${lbs.toFixed(1)} lbs (${kg.toFixed(1)} kg)`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatDimensions(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  preferImperial: boolean
): string {
  if (preferImperial) {
    const lengthIn = cmToInches(lengthCm);
    const widthIn = cmToInches(widthCm);
    const heightIn = cmToInches(heightCm);

    const lengthFt = Math.floor(lengthIn / 12);
    const lengthInRem = Math.round(lengthIn % 12);
    const widthFt = Math.floor(widthIn / 12);
    const widthInRem = Math.round(widthIn % 12);
    const heightFt = Math.floor(heightIn / 12);
    const heightInRem = Math.round(heightIn % 12);

    return `${lengthFt}'${lengthInRem}" × ${widthFt}'${widthInRem}" × ${heightFt}'${heightInRem}" (${lengthCm} × ${widthCm} × ${heightCm} cm)`;
  }
  return `${lengthCm} × ${widthCm} × ${heightCm} cm`;
}

export function shouldUseImperial(): boolean {
  // For React Native, use a different approach
  try {
    const { Platform } = require("react-native");
    if (Platform.OS === "ios" || Platform.OS === "android") {
      // For mobile, check locale from device
      // Use dynamic import with error handling for native module
      try {
        const localization = require("expo-localization");
        if (localization && localization.getLocales) {
          const locales = localization.getLocales();
          if (locales && locales.length > 0) {
            const locale = locales[0].regionCode || locales[0].languageCode;
            return locale === "US";
          }
        }
      } catch (localizationError) {
        // Native module not available - fallback to false
        // This can happen if the app hasn't been rebuilt after adding the package
        console.warn("expo-localization not available, defaulting to metric units");
        return false;
      }
    }
    return false;
  } catch {
    return false;
  }
}
