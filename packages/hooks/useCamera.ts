/**
 * useCamera - Universal camera hook for web and mobile
 * 
 * Web: Uses <input type="file">
 * Mobile: Uses expo-camera
 */

import { useState, useCallback } from 'react';
import { isWeb, isMobile } from '@sparecarry/lib/platform';

// Conditional import for expo-image-picker (mobile only)
let ImagePicker: typeof import('expo-image-picker') | null = null;
if (isMobile && typeof require !== 'undefined') {
  try {
    ImagePicker = require('expo-image-picker');
  } catch (e) {
    // expo-image-picker not available
  }
}

export interface CameraResult {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

interface UseCameraOptions {
  allowsEditing?: boolean;
  quality?: number;
  aspect?: [number, number];
}

/**
 * React hook for camera access
 */
export function useCamera(options: UseCameraOptions = {}) {
  const { allowsEditing = false, quality = 0.8, aspect = [4, 3] } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const takePicture = useCallback(async (): Promise<CameraResult | null> => {
    setLoading(true);
    setError(null);

    try {
      if (isWeb) {
        // Web: Use file input
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment'; // Use back camera on mobile web
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                resolve({
                  uri: event.target?.result as string,
                  type: file.type,
                  name: file.name,
                  size: file.size,
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
            setLoading(false);
          };
          input.oncancel = () => {
            setLoading(false);
            resolve(null);
          };
          input.click();
        });
      } else {
        // Mobile: Use expo-image-picker
        if (!ImagePicker) {
          throw new Error('expo-image-picker not available');
        }
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing,
          quality,
          aspect,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

        if (result.canceled) {
          return null;
        }

        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          size: asset.fileSize,
        };
      }
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [allowsEditing, quality, aspect]);

  const pickImage = useCallback(async (): Promise<CameraResult | null> => {
    setLoading(true);
    setError(null);

    try {
      if (isWeb) {
        // Web: Use file input
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                resolve({
                  uri: event.target?.result as string,
                  type: file.type,
                  name: file.name,
                  size: file.size,
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
            setLoading(false);
          };
          input.oncancel = () => {
            setLoading(false);
            resolve(null);
          };
          input.click();
        });
      } else {
        // Mobile: Use expo-image-picker
        if (!ImagePicker) {
          throw new Error('expo-image-picker not available');
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media library permission denied');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing,
          quality,
          aspect,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

        if (result.canceled) {
          return null;
        }

        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          size: asset.fileSize,
        };
      }
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [allowsEditing, quality, aspect]);

  return {
    takePicture,
    pickImage,
    loading,
    error,
  };
}

