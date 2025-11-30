/**
 * Photo Preview Grid Component
 *
 * Displays uploaded photos in a grid with delete and reorder options
 */

"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface PhotoPreviewGridProps {
  photos: (File | string)[];
  onRemove: (index: number) => void;
  onReorder?: (newOrder: (File | string)[]) => void;
  maxColumns?: number;
}

export function PhotoPreviewGrid({
  photos,
  onRemove,
  onReorder,
  maxColumns = 3,
}: PhotoPreviewGridProps) {
  const getPreviewUrl = (photo: File | string): string => {
    if (typeof photo === "string") {
      return photo; // Already a URL
    }
    return URL.createObjectURL(photo); // File object
  };

  return (
    <div className={`grid grid-cols-${maxColumns} gap-3`}>
      {photos.map((photo, index) => {
        const previewUrl = getPreviewUrl(photo);
        return (
          <div key={index} className="group relative">
            <div className="aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100">
              <img
                src={previewUrl}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-6 w-6 rounded-full p-0"
                onClick={() => onRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
              {index + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
