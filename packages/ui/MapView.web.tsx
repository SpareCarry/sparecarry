/**
 * MapView - Web implementation
 * Uses Google Maps or similar web mapping library
 */

import React from 'react';

interface MapViewProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function MapView({ latitude, longitude, onLocationChange, className }: MapViewProps) {
  // Web implementation would use Google Maps API or similar
  // For now, return a placeholder
  return (
    <div className={className} style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0' }}>
      <p>Map View (Web) - {latitude}, {longitude}</p>
      {/* TODO: Integrate with @react-google-maps/api */}
    </div>
  );
}

