/**
 * Distance Calculator
 * 
 * Calculates distance between two geographic coordinates using Haversine formula
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(coord1: Coordinates | null | undefined, coord2: Coordinates | null | undefined): number {
  // Validate inputs
  if (!coord1 || !coord2) {
    return 0;
  }
  
  if (typeof coord1.lat !== 'number' || typeof coord1.lon !== 'number' ||
      typeof coord2.lat !== 'number' || typeof coord2.lon !== 'number') {
    return 0;
  }
  
  if (isNaN(coord1.lat) || isNaN(coord1.lon) || isNaN(coord2.lat) || isNaN(coord2.lon)) {
    return 0;
  }
  
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate boat shipping distance (accounts for shipping routes, not straight-line)
 * Boats follow shipping routes which are typically 10-30% longer than straight-line distance
 * 
 * Factors that increase distance:
 * - Going around land masses (e.g., around Cape of Good Hope vs through Suez)
 * - Following shipping lanes
 * - Port-to-port routing
 * - Avoiding restricted areas
 */
export function calculateBoatShippingDistance(
  coord1: Coordinates | null | undefined,
  coord2: Coordinates | null | undefined
): number {
  const straightLineDistance = calculateDistance(coord1, coord2);
  if (straightLineDistance === 0) return 0;
  
  // Apply route complexity multiplier for boat shipping
  // Straight-line distance is typically 70-90% of actual shipping route distance
  let routeMultiplier = 1.15; // Default 15% increase for typical routes
  
  // For very long distances (trans-oceanic), routes are more optimized
  if (straightLineDistance > 10000) {
    routeMultiplier = 1.10; // 10% increase for very long routes
  } else if (straightLineDistance > 5000) {
    routeMultiplier = 1.20; // 20% increase for long routes (more detours)
  } else if (straightLineDistance > 2000) {
    routeMultiplier = 1.25; // 25% increase for medium routes (coastal navigation)
  } else if (straightLineDistance < 500) {
    routeMultiplier = 1.30; // 30% increase for short routes (more coastal navigation)
  }
  
  // Additional complexity factors (could be enhanced with actual route data)
  // For now, we use a conservative multiplier
  const boatDistance = straightLineDistance * routeMultiplier;
  
  return Math.round(boatDistance * 100) / 100;
}

/**
 * Estimate distance between two countries (using country centroids)
 * This is a fallback when exact coordinates are not available
 */
export function estimateCountryDistance(
  originCountry: string,
  destinationCountry: string
): number | null {
  // This would ideally use a country centroid database
  // For now, return null and let the UI handle it
  // In production, you could use a service like geonames or a static database
  return null;
}

