/**
 * useAutoMeasurePhoto - Hook for capturing, saving, and uploading auto-measure photos
 *
 * Handles:
 * - View capture with overlay
 * - Local storage (offline support)
 * - File conversion for web compatibility
 * - Upload to Supabase Storage
 */

import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { Dimensions, MeasurementResult } from "./types";
import { CapturedPhoto } from "./types";

// Conditional import for react-native-view-shot
let ViewShot: typeof import("react-native-view-shot") | null = null;
if (typeof require !== "undefined") {
  try {
    ViewShot = require("react-native-view-shot");
  } catch (e) {
    // react-native-view-shot not available
  }
}

// Conditional import for expo-file-system
let FileSystem: typeof import("expo-file-system") | null = null;
if (typeof require !== "undefined") {
  try {
    FileSystem = require("expo-file-system");
  } catch (e) {
    // expo-file-system not available
  }
}

// Conditional import for expo-image-manipulator
let ImageManipulator: typeof import("expo-image-manipulator") | null = null;
if (typeof require !== "undefined") {
  try {
    ImageManipulator = require("expo-image-manipulator");
  } catch (e) {
    // expo-image-manipulator not available
  }
}

interface UseAutoMeasurePhotoOptions {
  onPhotoCaptured?: (photo: CapturedPhoto) => void;
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Convert URI to File object (for web compatibility)
 * On mobile, returns a file-like object that can be used with Supabase upload
 */
async function uriToFile(
  uri: string,
  filename: string
): Promise<File | { uri: string; name: string; type: string }> {
  if (Platform.OS === "web") {
    // Web: Fetch and convert to File
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], filename, { type: "image/jpeg" });
  } else {
    // Mobile: Return file-like object with URI
    // Supabase Storage can handle URI directly on mobile
    return {
      uri,
      name: filename,
      type: "image/jpeg",
    };
  }
}

/**
 * Compress image for upload
 */
async function compressImage(
  uri: string,
  quality: number = 0.8,
  maxWidth: number = 1920
): Promise<string> {
  if (!ImageManipulator) {
    return uri; // Return original if manipulator not available
  }

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.warn(
      "[useAutoMeasurePhoto] Compression failed, using original:",
      error
    );
    return uri;
  }
}

/**
 * Save photo to local storage (offline support)
 */
async function savePhotoLocally(
  uri: string,
  filename: string
): Promise<string> {
  if (Platform.OS === "web") {
    // Web: Store in IndexedDB or localStorage (simplified - just return URI)
    return uri;
  } else {
    // Mobile: Save to app's document directory
    if (!FileSystem) {
      throw new Error("expo-file-system not available");
    }

    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: fileUri,
    });

    return fileUri;
  }
}

export function useAutoMeasurePhoto(options: UseAutoMeasurePhotoOptions = {}) {
  const { onPhotoCaptured, onUploadComplete, onError } = options;
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(
    null
  );

  /**
   * Capture view with overlay
   */
  const captureView = useCallback(
    async (
      viewRef: React.RefObject<any>,
      measurementResult: MeasurementResult
    ): Promise<CapturedPhoto | null> => {
      if (!viewRef.current) {
        throw new Error("View ref not available");
      }

      if (!ViewShot) {
        throw new Error("react-native-view-shot not available");
      }

      try {
        setIsCapturing(true);

        // Capture the view (camera + overlay)
        const uri = await ViewShot.captureRef(viewRef, {
          format: "jpg",
          quality: 0.9, // High quality for overlay visibility
          result: "tmpfile", // Save as temporary file
        });

        // Compress the image
        const compressedUri = await compressImage(uri, 0.8, 1920);

        // Generate filename
        const timestamp = Date.now();
        const filename = `auto-measure-${timestamp}.jpg`;

        // Save locally (offline support)
        const localUri = await savePhotoLocally(compressedUri, filename);

        // Convert to File object for web compatibility
        const file = await uriToFile(compressedUri, filename);

        const photo: CapturedPhoto = {
          uri: localUri,
          file,
          dimensions: measurementResult.dimensions,
          timestamp,
          confidence: measurementResult.confidence,
          isAutoMeasure: true,
        };

        setCapturedPhoto(photo);
        onPhotoCaptured?.(photo);

        return photo;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to capture photo");
        console.error("[useAutoMeasurePhoto] Capture error:", err);
        onError?.(err);
        return null;
      } finally {
        setIsCapturing(false);
      }
    },
    [onPhotoCaptured, onError]
  );

  /**
   * Upload photo to Supabase Storage
   * Handles both File objects (web) and URI objects (mobile)
   */
  const uploadPhoto = useCallback(
    async (
      photo: CapturedPhoto,
      userId: string,
      supabase: any
    ): Promise<string | null> => {
      if (!photo.file && !photo.uri) {
        throw new Error("Photo file or URI not available");
      }

      try {
        setIsUploading(true);

        // Generate file path
        const fileExt = "jpg";
        const fileName = `${userId}/auto-measure-${photo.timestamp}.${fileExt}`;
        const filePath = `requests/${fileName}`;

        // Prepare upload data
        let uploadData: any;
        let uploadOptions: any = {
          contentType: "image/jpeg",
          upsert: false,
        };

        if (Platform.OS === "web" && photo.file instanceof File) {
          // Web: Use File object directly
          uploadData = photo.file;
        } else if (photo.uri) {
          // Mobile: Use URI with fetch
          // For Supabase Storage on mobile, we need to convert URI to blob first
          if (FileSystem) {
            const base64 = await FileSystem.readAsStringAsync(photo.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            uploadData = byteArray;
          } else {
            // Fallback: try to use URI directly (may not work with all Supabase clients)
            uploadData = photo.uri;
          }
        } else {
          throw new Error("Unable to prepare photo for upload");
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(filePath, uploadData, uploadOptions);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("item-photos").getPublicUrl(filePath);

        onUploadComplete?.(publicUrl);
        return publicUrl;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to upload photo");
        console.error("[useAutoMeasurePhoto] Upload error:", err);
        onError?.(err);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, onError]
  );

  /**
   * Clear captured photo
   */
  const clearPhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  return {
    captureView,
    uploadPhoto,
    clearPhoto,
    isCapturing,
    isUploading,
    capturedPhoto,
  };
}
