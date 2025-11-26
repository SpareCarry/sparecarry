/**
 * Geoapify API Helpers
 * 
 * Direct integration with Geoapify API endpoints.
 * This file contains API-specific logic. Switch providers by editing this file only.
 */

import { LOCATION_CONFIG } from '../config/location.config';

export interface GeoapifyPlace {
  id?: string;
  name: string;
  lat: number;
  lon: number;
  category?: string;
  raw?: any;
}

const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1';
const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || process.env.EXPO_PUBLIC_GEOAPIFY_KEY || 'd6dec9413f4f495295e42d4158a3803d';

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
function normalizeFeature(feature: any): GeoapifyPlace {
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

/**
 * Autocomplete places using Geoapify
 */
export async function geoapifyAutocomplete(
  query: string,
  opts?: {
    limit?: number;
    filter?: 'marina' | 'port' | 'any';
    bbox?: [minLon: number, minLat: number, maxLon: number, maxLat: number];
    allowFallback?: boolean;
  }
): Promise<GeoapifyPlace[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const limit = opts?.limit || LOCATION_CONFIG.DEFAULT_AUTOCOMPLETE_LIMIT;
  const filter = opts?.filter || 'any';
  const allowFallback = opts?.allowFallback !== false;

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
      // Geoapify supports bbox parameter
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
      console.warn(`Geoapify autocomplete failed: ${response.status}`);
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
        console.log('No marinas found, returning all results as fallback');
        results = features;
      }
    }

    // Normalize and limit results
    return results
      .slice(0, limit)
      .map(normalizeFeature)
      .filter(place => place.lat !== 0 && place.lon !== 0);
  } catch (error) {
    console.error('Geoapify autocomplete error:', error);
    return [];
  }
}

/**
 * Reverse geocode: convert lat/lon to place name
 */
export async function geoapifyReverse(
  lat: number,
  lon: number
): Promise<GeoapifyPlace | null> {
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return null;
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
      console.warn(`Geoapify reverse geocode failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length === 0) {
      return null;
    }

    return normalizeFeature(features[0]);
  } catch (error) {
    console.error('Geoapify reverse geocode error:', error);
    return null;
  }
}

/**
 * Forward geocode: convert place name to lat/lon
 */
export async function geoapifyForward(name: string): Promise<GeoapifyPlace | null> {
  if (!name || name.trim().length < 2) {
    return null;
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
      console.warn(`Geoapify forward geocode failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length === 0) {
      return null;
    }

    return normalizeFeature(features[0]);
  } catch (error) {
    console.error('Geoapify forward geocode error:', error);
    return null;
  }
}

