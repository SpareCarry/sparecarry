/**
 * MapView - Native (iOS/Android) implementation
 * Uses react-native-maps
 */

import React from 'react';
import { View, Text } from 'react-native';
// import MapView from 'react-native-maps'; // TODO: Install react-native-maps

interface MapViewProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  style?: any;
}

export function MapView({ latitude, longitude, onLocationChange, style }: MapViewProps) {
  // Native implementation would use react-native-maps
  // For now, return a placeholder
  return (
    <View style={[{ width: '100%', height: 400, backgroundColor: '#f0f0f0' }, style]}>
      <Text>Map View (Native) - {latitude}, {longitude}</Text>
      {/* TODO: Integrate with react-native-maps */}
    </View>
  );
}

