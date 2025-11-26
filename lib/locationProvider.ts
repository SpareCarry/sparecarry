/**
 * Location Provider Abstraction
 * 
 * Unified interface for location services. Switch providers by editing lib/geoapify.ts only.
 * All UI components use this abstraction layer.
 */

import { geoapifyAutocomplete, geoapifyReverse, geoapifyForward, GeoapifyPlace } from './geoapify';

export interface Place {
  id?: string;
  name: string;
  lat: number;
  lon: number;
  category?: string;
  raw?: any;
}

export interface AutocompleteOptions {
  limit?: number;
  filter?: 'marina' | 'port' | 'any';
  bbox?: [minLon: number, minLat: number, maxLon: number, maxLat: number];
  allowFallback?: boolean;
}

/**
 * Autocomplete places based on query string
 */
export async function autocomplete(
  query: string,
  opts?: AutocompleteOptions
): Promise<Place[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Delegate to Geoapify implementation
  return geoapifyAutocomplete(query, opts);
}

/**
 * Reverse geocode: convert coordinates to place name
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<Place | null> {
  return geoapifyReverse(lat, lon);
}

/**
 * Forward geocode: convert place name to coordinates
 */
export async function forwardGeocode(name: string): Promise<Place | null> {
  return geoapifyForward(name);
}

// Re-export types for convenience
export type { GeoapifyPlace as PlaceType };

