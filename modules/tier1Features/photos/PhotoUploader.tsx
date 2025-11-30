/**
 * Photo Uploader Component
 *
 * Handles photo selection, compression, and upload to Supabase Storage
 * For Expo compatibility - uses web File API as fallback
 */

"use client";

import React, { useState, useCallback } from "react";
import { Button } from "../../../components/ui/button";
import { Camera, Image as ImageIcon, X, Upload } from "lucide-react";
import { PhotoPreviewGrid } from "../ui/PhotoPreviewGrid";
import { verifyPhotoSet } from "./usePhotoVerification";

/**
 * Compress image file client-side
 * Reduces file size while maintaining quality
 */
async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback to original
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface PhotoUploaderProps {
  photos: (File | string)[];
  onPhotosChange: (photos: (File | string)[]) => void;
  maxPhotos?: number;
  minPhotos?: number;
  disabled?: boolean;
}

export function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 4, // Updated to allow up to 4 photos
  minPhotos = 1, // Reduced minimum for flexibility
  disabled = false,
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newPhotos: File[] = [];
      const remainingSlots = maxPhotos - photos.length;

      // Add up to remaining slots
      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        if (file && file.type.startsWith("image/")) {
          newPhotos.push(file);
        }
      }

      if (newPhotos.length > 0) {
        // Compress images before adding (client-side compression)
        const compressedPhotos = await Promise.all(
          newPhotos.map((file) => compressImage(file))
        );
        const updated = [...photos, ...compressedPhotos];
        onPhotosChange(updated);
      }

      // Reset input
      event.target.value = "";
    },
    [photos, maxPhotos, onPhotosChange]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      const updated = photos.filter((_, i) => i !== index);
      onPhotosChange(updated);
    },
    [photos, onPhotosChange]
  );

  const handleReorder = useCallback(
    (newOrder: (File | string)[]) => {
      onPhotosChange(newOrder);
    },
    [onPhotosChange]
  );

  const verification = verifyPhotoSet(
    photos.filter((p): p is File => typeof p !== "string")
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Item Photos
          <span className="ml-1 text-red-500">*</span>
        </label>
        <p className="mb-3 text-sm text-slate-500">
          Add clear photos of the item (front, side, and one showing size for
          scale). Minimum {minPhotos}, up to {maxPhotos}.
        </p>

        <div className="flex gap-2">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || photos.length >= maxPhotos}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || photos.length >= maxPhotos}
              className="cursor-pointer"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {photos.length >= maxPhotos ? "Max photos reached" : "Add Photos"}
            </Button>
          </label>
        </div>

        {photos.length > 0 && (
          <div className="mt-4">
            <PhotoPreviewGrid
              photos={photos}
              onRemove={handleRemovePhoto}
              onReorder={handleReorder}
            />
          </div>
        )}

        {!verification.verified && verification.errors && (
          <div className="mt-2 text-sm text-red-600">
            {verification.errors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
