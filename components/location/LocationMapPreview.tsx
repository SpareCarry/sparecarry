/**
 * Location Map Preview Component
 *
 * Displays a map preview with marker for selected location.
 * Shows marina icon if location is a marina/port.
 */

"use client";

import React from "react";
import Image from "next/image";
import { Place } from "../../lib/services/location";
import { MapPin, Anchor } from "lucide-react";
import { LOCATION_CONFIG } from "../../config/location.config";

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
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-slate-400">
          <MapPin className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">No location selected</p>
        </div>
      </div>
    );
  }

  // For web, we'll use a static map image or embed
  // For mobile apps with react-native-maps, this would be different
  const isMarina = place.category === "marina" || place.category === "port";

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-200 ${className}`}
      style={{ height }}
    >
      {/* Map preview - using static map API */}
      <a
        href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}&zoom=14`}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
      >
        <Image
          src={`https://api.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=600&height=300&center=lonlat:${place.lon},${place.lat}&zoom=14&marker=lonlat:${place.lon},${place.lat};size:large;color:teal&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY || "d6dec9413f4f495295e42d4158a3803d"}`}
          alt={place.name}
          width={600}
          height={300}
          className="h-full w-full object-cover"
          unoptimized
          onError={(e) => {
            // Fallback to simple colored background
            (e.target as HTMLImageElement).style.display = "none";
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.style.backgroundColor = "#e2e8f0";
            }
          }}
        />
      </a>

      {/* Info card overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-start gap-2">
          {isMarina && (
            <Anchor className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-300" />
          )}
          {!isMarina && (
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {place.name}
            </p>
            {place.category && (
              <p className="text-xs capitalize text-white/80">
                {place.category}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
