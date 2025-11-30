/**
 * Country Presets Utility
 *
 * Provides default dimensions and weight presets for countries
 */

const countryPresetsData = require("../../assets/data/countryPresets.json");

export interface CountryPresets {
  [countryCode: string]: {
    default_length: number;
    default_width: number;
    default_height: number;
    default_weight: number;
  };
}

export interface PresetDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

/**
 * Get preset dimensions and weight for a country
 */
export function getCountryPreset(countryCode: string): PresetDimensions | null {
  const preset = (countryPresetsData as CountryPresets)[
    countryCode.toUpperCase()
  ];
  if (!preset) return null;

  return {
    length: preset.default_length,
    width: preset.default_width,
    height: preset.default_height,
    weight: preset.default_weight,
  };
}

/**
 * Get all available country codes with presets
 */
export function getAvailablePresetCountries(): string[] {
  return Object.keys(countryPresetsData);
}
