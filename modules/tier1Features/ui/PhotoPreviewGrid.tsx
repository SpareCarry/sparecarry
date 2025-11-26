/**
 * Photo Preview Grid Component
 * 
 * Displays uploaded photos in a grid with delete and reorder options
 */

"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';

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
    if (typeof photo === 'string') {
      return photo; // Already a URL
    }
    return URL.createObjectURL(photo); // File object
  };

  return (
    <div className={`grid grid-cols-${maxColumns} gap-3`}>
      {photos.map((photo, index) => {
        const previewUrl = getPreviewUrl(photo);
        return (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200">
              <img
                src={previewUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => onRemove(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

