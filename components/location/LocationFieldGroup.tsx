/**
 * Location Field Group Component
 * 
 * Complete location input group with autocomplete, map preview, and current location button.
 * Wraps LocationInput, LocationMapPreview, and UseCurrentLocationButton for easy integration.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Magnet, MapPin } from 'lucide-react';
import { LocationInput } from './LocationInput';
import { LocationMapPreview } from './LocationMapPreview';
import { UseCurrentLocationButton } from './UseCurrentLocationButton';
import { LocationDraggablePicker } from './LocationDraggablePicker';
import { Place } from '../../lib/services/location';

interface LocationFieldGroupProps {
  label: string;
  placeholder?: string;
  value?: Place | null;
  onChange: (place: Place | null) => void;
  showOnlyMarinas?: boolean;
  allowFallbackToAny?: boolean;
  showMapPreview?: boolean;
  showCurrentLocation?: boolean;
  showMapPicker?: boolean;
  bbox?: [minLon: number, minLat: number, maxLon: number, maxLat: number];
  required?: boolean;
  error?: string;
  className?: string;
  inputId?: string;
  inputName?: string;
}

export function LocationFieldGroup({
  label,
  placeholder = "Search location...",
  value,
  onChange,
  showOnlyMarinas = false,
  allowFallbackToAny = true,
  showMapPreview = true,
  showCurrentLocation = true,
  showMapPicker = true,
  bbox,
  required = false,
  error,
  className = "",
  inputId,
  inputName,
}: LocationFieldGroupProps) {
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      // Check for touch capability and screen size
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(hasTouchScreen && (isSmallScreen || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelect = (place: Place) => {
    onChange(place);
  };

  const handleCurrentLocation = (place: Place) => {
    onChange(place);
  };

  const handleMapPickerConfirm = (place: Place) => {
    onChange(place);
    setIsMapPickerOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>

      <LocationInput
        inputId={inputId}
        name={inputName}
        placeholder={placeholder}
        onSelect={handleSelect}
        initialValue={value?.name || ""}
        showOnlyMarinas={showOnlyMarinas}
        allowFallbackToAny={allowFallbackToAny}
        bbox={bbox}
        className="w-full"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        {showMapPicker && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsMapPickerOpen(true)}
            className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50 font-medium"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Pick on Map
          </Button>
        )}
        {showCurrentLocation && isMobile && (
          <UseCurrentLocationButton
            onLocationFound={handleCurrentLocation}
            showOnlyMarinas={showOnlyMarinas}
            onSuggestMapPicker={() => setIsMapPickerOpen(true)}
            className="flex-1"
          />
        )}
      </div>

      {showMapPreview && value && (
        <LocationMapPreview place={value} className="w-full" />
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {showOnlyMarinas && (
        <p className="text-xs text-slate-500">
          💡 Tip: Toggle &quot;Marinas only&quot; to list marina & port options
        </p>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <LocationDraggablePicker
          isOpen={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          onConfirm={handleMapPickerConfirm}
          initialLocation={value ? { lat: value.lat, lon: value.lon } : undefined}
          showMarinaSnap={showOnlyMarinas}
        />
      )}
    </div>
  );
}

