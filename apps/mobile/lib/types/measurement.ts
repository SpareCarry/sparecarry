/**
 * Type definitions for AR Auto-Measure feature
 */

export interface ARMeasurementResult {
  /** Length in meters (AR) or cm (photo reference) */
  L: number;
  /** Width in meters (AR) or cm (photo reference) */
  W: number;
  /** Height in meters (AR) or cm (photo reference) */
  H: number;
  /** Volume in cubic meters */
  volume: number;
  /** URI of captured photo/screenshot */
  photoUri: string;
  /** Measurement confidence level */
  confidence: "High" | "Low";
}

/**
 * Point in 3D space (for AR measurements)
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Cuboid bounding box definition (for AR)
 */
export interface CuboidBoundingBox {
  /** Minimum corner (closest to origin) */
  min: Point3D;
  /** Maximum corner (furthest from origin) */
  max: Point3D;
  /** Center point */
  center: Point3D;
  /** Dimensions */
  dimensions: {
    length: number; // meters
    width: number; // meters
    height: number; // meters
  };
}

/**
 * Trace measurement data (for photo reference method)
 */
export interface TraceMeasurement {
  /** Starting point (pixels) */
  start: { x: number; y: number };
  /** Ending point (pixels) */
  end: { x: number; y: number };
  /** Measured length in pixels */
  pixelLength: number;
  /** Real-world length in cm */
  realLengthCm: number;
}

/**
 * Reference object dimensions
 */
export interface ReferenceObject {
  type: "US Letter" | "A4";
  /** Known width in cm */
  widthCm: number;
  /** Known height in cm */
  heightCm: number;
}

// Reference object constants
export const REFERENCE_OBJECTS: Record<string, ReferenceObject> = {
  "US Letter": {
    type: "US Letter",
    widthCm: 21.59,
    heightCm: 27.94,
  },
  A4: {
    type: "A4",
    widthCm: 21.0,
    heightCm: 29.7,
  },
};

