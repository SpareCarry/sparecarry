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
  if (typeof window === "undefined") return false;

  try {
    const locale = navigator.language || "en-US";
    return locale.startsWith("en-US");
  } catch {
    return false;
  }
}
