/**
 * ETA Types
 */

export interface EtaResult {
  estimatedHours: number;
  estimatedDays: number;
  method: 'plane' | 'boat' | 'manual';
  isManual?: boolean;
  manualDays?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

