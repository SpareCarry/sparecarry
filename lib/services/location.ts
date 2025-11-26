/**
 * Unified Location Service
 * 
 * Consolidated location provider with Geoapify integration, caching, and debouncing.
 * Replaces: lib/locationProvider.ts + lib/geoapify.ts
 */

import { LOCATION_CONFIG } from '../../config/location.config';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Configuration
// ============================================================================

const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1';
const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || process.env.EXPO_PUBLIC_GEOAPIFY_KEY || 'd6dec9413f4f495295e42d4158a3803d';

// ============================================================================
// Caching
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LocationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new LocationCache();

// ============================================================================
// Debouncing
// ============================================================================

class Debouncer {
  private timers = new Map<string, NodeJS.Timeout>();

  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = LOCATION_CONFIG.DEFAULT_DEBOUNCE_MS
  ): T {
    return ((...args: Parameters<T>) => {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }
      
      const timer = setTimeout(() => {
        fn(...args);
        this.timers.delete(key);
      }, delay);
      
      this.timers.set(key, timer);
    }) as T;
  }

  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

const debouncer = new Debouncer();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Client-side filter to detect marinas/ports from Geoapify feature properties
 */
function isMarinaOrPort(feature: any): boolean {
  const props = feature.properties || {};
  const placeName = (props.name || props.formatted || props.place_name || '').toLowerCase();
  const category = (props.category || props.type || '').toLowerCase();
  const poiCategory = props.poi?.category?.toLowerCase() || '';
  
  // Check category fields
  const categoryMatch = category.includes('marina') || 
                       category.includes('harbor') || 
                       category.includes('harbour') ||
                       category.includes('port') ||
                       poiCategory.includes('marina') ||
                       poiCategory.includes('harbor');

  // Check place name for keywords
  const keywordMatch = LOCATION_CONFIG.MARINA_KEYWORDS.some(keyword => 
    placeName.includes(keyword.toLowerCase())
  );

  // Check OSM tags if available
  const osmTags = props.osm_tags || {};
  const osmMatch = osmTags.amenity === 'marina' ||
                  osmTags.leisure === 'marina' ||
                  osmTags.harbour === 'yes';

  return categoryMatch || keywordMatch || osmMatch;
}

/**
 * Normalize Geoapify feature to standardized place format
 */
function normalizeFeature(feature: any): Place {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  
  let category: string | undefined;
  if (isMarinaOrPort(feature)) {
    category = 'marina';
  } else if (props.category) {
    category = props.category;
  } else if (props.type) {
    category = props.type;
  }

  return {
    id: feature.properties?.place_id || feature.id || undefined,
    name: props.name || props.formatted || props.place_name || 'Unknown location',
    lat: coords[1] || props.lat || 0,
    lon: coords[0] || props.lon || 0,
    category,
    raw: feature,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Autocomplete places using Geoapify with caching and debouncing
 */
export async function autocomplete(
  query: string,
  opts?: AutocompleteOptions
): Promise<Place[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const limit = opts?.limit || LOCATION_CONFIG.DEFAULT_AUTOCOMPLETE_LIMIT;
  const filter = opts?.filter || 'any';
  const allowFallback = opts?.allowFallback !== false;

  // Check cache
  const cacheKey = `autocomplete:${query}:${limit}:${filter}:${JSON.stringify(opts?.bbox)}`;
  const cached = cache.get<Place[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Build URL with optional bbox
    const params = new URLSearchParams({
      text: query.trim(),
      limit: (limit * 2).toString(), // Request more to account for filtering
      apiKey: API_KEY,
      lang: 'en',
      type: 'amenity,poi,place',
    });

    if (opts?.bbox) {
      const [minLon, minLat, maxLon, maxLat] = opts.bbox;
      params.append('bias', `proximity:${(minLon + maxLon) / 2},${(minLat + maxLat) / 2}`);
      params.append('bbox', `${minLon},${minLat},${maxLon},${maxLat}`);
    }

    const url = `${GEOAPIFY_BASE_URL}/geocode/autocomplete?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const features = data.features || [];

    // Apply client-side marina/port filter if needed
    let results: any[] = features;
    if (filter === 'marina' || filter === 'port') {
      results = features.filter(isMarinaOrPort);
      
      // Fallback: if no marinas found and fallback allowed, return all results
      if (results.length === 0 && allowFallback) {
        results = features;
      }
    }

    // Normalize and limit results
    const places = results
      .slice(0, limit)
      .map(normalizeFeature)
      .filter(place => place.lat !== 0 && place.lon !== 0);

    // Cache results
    cache.set(cacheKey, places);

    return places;
  } catch (error) {
    return [];
  }
}

/**
 * Reverse geocode: convert lat/lon to place name (with caching)
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<Place | null> {
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  // Check cache (use rounded coordinates for cache key)
  const cacheKey = `reverse:${Math.round(lat * 1000) / 1000}:${Math.round(lon * 1000) / 1000}`;
  const cached = cache.get<Place>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      apiKey: API_KEY,
      lang: 'en',
    });

    const url = `${GEOAPIFY_BASE_URL}/geocode/reverse?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length === 0) {
      return null;
    }

    const place = normalizeFeature(features[0]);
    
    // Cache result
    cache.set(cacheKey, place, 10 * 60 * 1000); // 10 minutes for reverse geocode

    return place;
  } catch (error) {
    return null;
  }
}

/**
 * Forward geocode: convert place name to lat/lon (with caching)
 */
export async function forwardGeocode(name: string): Promise<Place | null> {
  if (!name || name.trim().length < 2) {
    return null;
  }

  // Check cache
  const cacheKey = `forward:${name.toLowerCase().trim()}`;
  const cached = cache.get<Place>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({
      text: name.trim(),
      limit: '1',
      apiKey: API_KEY,
      lang: 'en',
    });

    const url = `${GEOAPIFY_BASE_URL}/geocode/search?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length === 0) {
      return null;
    }

    const place = normalizeFeature(features[0]);
    
    // Cache result
    cache.set(cacheKey, place);

    return place;
  } catch (error) {
    return null;
  }
}

/**
 * Debounced autocomplete wrapper
 */
export function debouncedAutocomplete(
  query: string,
  opts?: AutocompleteOptions,
  delay?: number
): Promise<Place[]> {
  return new Promise((resolve) => {
    const key = `autocomplete:${query}`;
    const debounced = debouncer.debounce(key, async () => {
      const results = await autocomplete(query, opts);
      resolve(results);
    }, delay);
    
    debounced();
  });
}

/**
 * Clear location cache
 */
export function clearLocationCache(): void {
  cache.clear();
}

/**
 * Clear debouncer timers
 */
export function clearDebouncer(): void {
  debouncer.clear();
}

// Re-export types for backward compatibility
export type { Place as PlaceType };

