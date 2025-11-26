/**
 * Location Draggable Picker Component
 * 
 * Fullscreen map modal with draggable pin for selecting location.
 * Option to snap to nearest marina.
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, MapPin, Anchor, Loader2, Magnet } from 'lucide-react';
import { reverseGeocode, autocomplete, Place } from '../../lib/services/location';
import { LOCATION_CONFIG } from '../../config/location.config';

interface LocationDraggablePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (place: Place) => void;
  initialLocation?: { lat: number; lon: number };
  showMarinaSnap?: boolean;
  className?: string;
}

export function LocationDraggablePicker({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
  showMarinaSnap = false,
  className = "",
}: LocationDraggablePickerProps) {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lon: number }>(
    initialLocation || { lat: 0, lon: 0 }
  );
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);

  // Reverse geocode position
  const reverseGeocodeForPosition = useCallback(async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    try {
      const place = await reverseGeocode(lat, lon);
      setSelectedPlace(place);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setSelectedPlace(null);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Initialize position
  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        setCurrentPosition(initialLocation);
        reverseGeocodeForPosition(initialLocation.lat, initialLocation.lon);
      } else {
        // Try to get user's current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentPosition({ lat: latitude, lon: longitude });
              reverseGeocodeForPosition(latitude, longitude);
            },
            () => {
              // Fallback to default center
              setCurrentPosition({ lat: LOCATION_CONFIG.DEFAULT_CENTER.lat, lon: LOCATION_CONFIG.DEFAULT_CENTER.lon });
            }
          );
        }
      }
    }
  }, [isOpen, initialLocation, reverseGeocodeForPosition]);

  // Handle map drag (simulated - in real implementation, this would be from map library)
  const handlePositionChange = useCallback((lat: number, lon: number) => {
    setCurrentPosition({ lat, lon });
    reverseGeocodeForPosition(lat, lon);
  }, [reverseGeocodeForPosition]);

  // Snap to nearest marina
  const snapToNearestMarina = useCallback(async () => {
    setIsSnapping(true);
    try {
      // Search for marinas near current position
      const query = `${currentPosition.lat},${currentPosition.lon}`;
      const results = await autocomplete(query, {
        limit: 5,
        filter: 'marina',
        bbox: [
          currentPosition.lon - 0.05,
          currentPosition.lat - 0.05,
          currentPosition.lon + 0.05,
          currentPosition.lat + 0.05,
        ],
      });

      if (results.length > 0) {
        const nearest = results[0]; // Results are typically sorted by proximity
        setCurrentPosition({ lat: nearest.lat, lon: nearest.lon });
        setSelectedPlace(nearest);
      } else {
        alert('No marinas found nearby. Try adjusting your position manually.');
      }
    } catch (error) {
      console.error('Snap to marina error:', error);
      alert('Failed to find nearby marina. Please try again.');
    } finally {
      setIsSnapping(false);
    }
  }, [currentPosition]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (selectedPlace) {
      onConfirm(selectedPlace);
      onClose();
    }
  }, [selectedPlace, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 flex items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Map Preview */}
          <div className="flex-1 relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentPosition.lon - 0.01},${currentPosition.lat - 0.01},${currentPosition.lon + 0.01},${currentPosition.lat + 0.01}&layer=mapnik&marker=${currentPosition.lat},${currentPosition.lon}`}
              className="w-full h-full"
              style={{ border: 0 }}
              title="Location picker map"
            />
            
            {/* Drag instructions */}
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-600">
              <p>Drag the map to adjust position</p>
            </div>

            {/* Center marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <MapPin className="h-8 w-8 text-teal-600 drop-shadow-lg" />
            </div>
          </div>

          {/* Selected location info */}
          <div className="flex-shrink-0 space-y-3">
            {isReverseGeocoding ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading location details...</span>
              </div>
            ) : selectedPlace ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-2">
                  {selectedPlace.category === 'marina' && (
                    <Anchor className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  )}
                  {selectedPlace.category !== 'marina' && (
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{selectedPlace.name}</p>
                    {selectedPlace.category && (
                      <p className="text-xs text-slate-500 capitalize mt-0.5">{selectedPlace.category}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {currentPosition.lat.toFixed(6)}, {currentPosition.lon.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-800">
                Could not determine location name. Please try a different position.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {showMarinaSnap && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={snapToNearestMarina}
                  disabled={isSnapping}
                  className="flex-1"
                >
                  {isSnapping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding...
                    </>
                  ) : (
                    <>
                      <Magnet className="h-4 w-4 mr-2" />
                      Snap to Nearest Marina
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedPlace}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Confirm Location
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

