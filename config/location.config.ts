/**
 * Location System Configuration
 * 
 * Centralized configuration for location features, marina filtering, and API behavior.
 * Edit these values to customize behavior without changing implementation code.
 */

export const LOCATION_CONFIG = {
  // Keywords used for client-side marina/port detection
  MARINA_KEYWORDS: [
    'marina',
    'marinas',
    'harbour',
    'harbor',
    'port',
    'pier',
    'dock',
    'berth',
    'slip',
    'boat',
    'marina bay',
    'yacht club',
    'yacht harbor',
    'boating',
    'wharf',
    'quay',
  ],

  // Default autocomplete result limit
  DEFAULT_AUTOCOMPLETE_LIMIT: 8,

  // Default debounce delay for search input (milliseconds)
  DEFAULT_DEBOUNCE_MS: 300,

  // Allow fallback to all results when marina filter produces no results
  FALLBACK_ALLOW: true,

  // Distance in km to search for nearest marina when snapping
  MARINA_SNAP_DISTANCE_KM: 5,

  // Default coordinates (fallback when user location unavailable)
  DEFAULT_CENTER: {
    lat: 0,
    lon: 0,
  },

  // Bounding box bias radius in degrees (approximate km conversion: 1 degree ≈ 111 km)
  DEFAULT_BBOX_RADIUS: 0.5, // ~55km radius
} as const;

