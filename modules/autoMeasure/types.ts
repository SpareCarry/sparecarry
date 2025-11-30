/**
 * Types for Auto-Measure feature
 */

export interface Dimensions {
  length: number; // in cm
  width: number; // in cm
  height: number; // in cm
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MeasurementResult {
  dimensions: Dimensions;
  confidence: number; // 0-1, rough estimate of accuracy
  boundingBox?: BoundingBox;
}

export interface CameraFrame {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface CapturedPhoto {
  uri: string;
  file?: File;
  dimensions: Dimensions;
  timestamp: number;
  confidence: number;
  isAutoMeasure: boolean;
  photoType?: "main" | "side" | "reference";
}

export interface TiltData {
  pitch: number; // Rotation around X-axis (forward/backward tilt)
  roll: number; // Rotation around Y-axis (left/right tilt)
  yaw: number; // Rotation around Z-axis (rotation)
}

export interface ReferenceObject {
  type: "credit_card" | "coin" | "paper" | "none";
  detectedSizePixels?: number;
  knownSizeCm: number; // Credit card: 8.56cm, Coin: 2.4cm, Paper: 21.59cm
  pixelToCmRatio?: number;
}

export interface MultiFrameMeasurement {
  frames: MeasurementResult[];
  averaged: MeasurementResult;
  tiltCorrected: MeasurementResult;
  referenceCalibrated?: MeasurementResult;
  referenceObject?: ReferenceObject;
  tiltData?: TiltData;
}
