/**
 * Location Map Preview Component
 * 
 * Displays a map preview with marker for selected location.
 * Shows marina icon if location is a marina/port.
 */

"use client";

import React from 'react';
import Image from 'next/image';
import { Place } from '../../lib/services/location';
import { MapPin, Anchor } from 'lucide-react';
import { LOCATION_CONFIG } from '../../config/location.config';

interface LocationMapPreviewProps {
  place?: Place | null;
  className?: string;
  height?: number;
}

export function LocationMapPreview({
  place,
  className = "",
  height = 200,
}: LocationMapPreviewProps) {
  if (!place) {
    return (
      <div
        className={`bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-slate-400">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No location selected</p>
        </div>
      </div>
    );
  }

  // For web, we'll use a static map image or embed
  // For mobile apps with react-native-maps, this would be different
  const isMarina = place.category === 'marina' || place.category === 'port';

  return (
    <div className={`relative rounded-lg border border-slate-200 overflow-hidden ${className}`} style={{ height }}>
      {/* Map preview - using static map API */}
      <a
        href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}&zoom=14`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <Image
          src={`https://api.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=600&height=300&center=lonlat:${place.lon},${place.lat}&zoom=14&marker=lonlat:${place.lon},${place.lat};size:large;color:teal&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY || 'd6dec9413f4f495295e42d4158a3803d'}`}
          alt={place.name}
          width={600}
          height={300}
          className="w-full h-full object-cover"
          unoptimized
          onError={(e) => {
            // Fallback to simple colored background
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.style.backgroundColor = '#e2e8f0';
            }
          }}
        />
      </a>

      {/* Info card overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-start gap-2">
          {isMarina && <Anchor className="h-4 w-4 text-teal-300 mt-0.5 flex-shrink-0" />}
          {!isMarina && <MapPin className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{place.name}</p>
            {place.category && (
              <p className="text-white/80 text-xs capitalize">{place.category}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

