/**
 * Route Segment Generation Logic
 *
 * Generates all valid route segments from a list of destinations.
 * For destinations [A, B, C, D], generates:
 * - Direct segments: A→B, B→C, C→D
 * - Skip-stop segments: A→C, A→D, B→D
 */

export interface RouteDestination {
  location: string;
  lat?: number;
  lng?: number;
  order: number; // Order in the route (0, 1, 2, ...)
  min_stay_days?: number;
  airport_codes?: string[]; // For plane routes
}

export interface RouteSegment {
  from: RouteDestination;
  to: RouteDestination;
  segmentType: "direct" | "skip_stop";
  segmentIndex: number; // Index in the segments array for this route
}

/**
 * Generate all valid route segments from destinations
 * @param destinations - Array of destinations in route order
 * @param allowSkipStops - Whether to generate skip-stop segments (default: true)
 * @returns Array of route segments
 */
export function generateRouteSegments(
  destinations: RouteDestination[],
  allowSkipStops: boolean = true
): RouteSegment[] {
  if (destinations.length < 2) {
    return [];
  }

  const segments: RouteSegment[] = [];

  // Sort destinations by order to ensure correct sequence
  const sortedDestinations = [...destinations].sort(
    (a, b) => a.order - b.order
  );

  // Generate direct segments (consecutive destinations)
  for (let i = 0; i < sortedDestinations.length - 1; i++) {
    segments.push({
      from: sortedDestinations[i],
      to: sortedDestinations[i + 1],
      segmentType: "direct",
      segmentIndex: segments.length,
    });
  }

  // Generate skip-stop segments (non-consecutive destinations)
  if (allowSkipStops && sortedDestinations.length > 2) {
    for (let i = 0; i < sortedDestinations.length - 2; i++) {
      for (let j = i + 2; j < sortedDestinations.length; j++) {
        segments.push({
          from: sortedDestinations[i],
          to: sortedDestinations[j],
          segmentType: "skip_stop",
          segmentIndex: segments.length,
        });
      }
    }
  }

  return segments;
}

/**
 * Find segments that match a request's from/to locations
 * @param segments - Array of route segments
 * @param requestFrom - Request origin location
 * @param requestTo - Request destination location
 * @param fuzzyMatch - Whether to allow fuzzy location matching (default: true)
 * @returns Array of matching segments with match scores
 */
export function findMatchingSegments(
  segments: RouteSegment[],
  requestFrom: string,
  requestTo: string,
  fuzzyMatch: boolean = true
): Array<
  RouteSegment & { matchScore: number; matchType: "exact" | "fuzzy" | "none" }
> {
  const normalize = (loc: string) =>
    loc.toLowerCase().trim().replace(/\s+/g, " ");
  const reqFrom = normalize(requestFrom);
  const reqTo = normalize(requestTo);

  return segments
    .map((segment) => {
      const segFrom = normalize(segment.from.location);
      const segTo = normalize(segment.to.location);

      // Exact match (both from and to match exactly)
      if (segFrom === reqFrom && segTo === reqTo) {
        return {
          ...segment,
          matchScore: 100,
          matchType: "exact" as const,
        };
      }

      if (fuzzyMatch) {
        // Fuzzy match - check if locations contain each other
        const fromMatch =
          segFrom.includes(reqFrom) || reqFrom.includes(segFrom);
        const toMatch = segTo.includes(reqTo) || reqTo.includes(segTo);

        if (fromMatch && toMatch) {
          return {
            ...segment,
            matchScore: 80,
            matchType: "fuzzy" as const,
          };
        }

        // Partial match - one direction matches
        if (fromMatch || toMatch) {
          return {
            ...segment,
            matchScore: 50,
            matchType: "fuzzy" as const,
          };
        }
      }

      return {
        ...segment,
        matchScore: 0,
        matchType: "none" as const,
      };
    })
    .filter((result) => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
}

/**
 * Calculate total route distance estimate (rough approximation)
 * Uses Haversine formula if coordinates are available
 * @param destinations - Array of destinations
 * @returns Estimated distance in kilometers
 */
export function calculateRouteDistance(
  destinations: RouteDestination[]
): number | null {
  if (destinations.length < 2) {
    return null;
  }

  const sortedDestinations = [...destinations].sort(
    (a, b) => a.order - b.order
  );
  let totalDistance = 0;

  for (let i = 0; i < sortedDestinations.length - 1; i++) {
    const from = sortedDestinations[i];
    const to = sortedDestinations[i + 1];

    if (from.lat && from.lng && to.lat && to.lng) {
      const distance = haversineDistance(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng }
      );
      totalDistance += distance;
    } else {
      // If coordinates not available, cannot calculate
      return null;
    }
  }

  return totalDistance;
}

/**
 * Haversine distance formula
 * Calculates distance between two points on Earth in kilometers
 */
function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate route destinations
 * @param destinations - Array of destinations to validate
 * @returns Validation result with errors if any
 */
export function validateRouteDestinations(destinations: RouteDestination[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (destinations.length < 2) {
    errors.push("Route must have at least 2 destinations");
    return { valid: false, errors };
  }

  // Check for duplicate locations
  const locations = destinations.map((d) => d.location.toLowerCase().trim());
  const uniqueLocations = new Set(locations);
  if (uniqueLocations.size !== locations.length) {
    errors.push("Route cannot have duplicate destinations");
  }

  // Check for valid order sequence
  const orders = destinations.map((d) => d.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i) {
      errors.push(
        `Destination orders must be sequential starting from 0 (found gap at ${i})`
      );
      break;
    }
  }

  // Check each destination has required fields
  destinations.forEach((dest, index) => {
    if (!dest.location || dest.location.trim().length === 0) {
      errors.push(`Destination ${index + 1} must have a location name`);
    }
    if (typeof dest.order !== "number" || dest.order < 0) {
      errors.push(`Destination ${index + 1} must have a valid order number`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
