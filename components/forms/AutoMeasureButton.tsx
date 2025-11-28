/**
 * AutoMeasureButton - Button to trigger auto-measure camera
 * 
 * Mobile: Opens camera screen for measurement
 * Web: Shows info message (camera measurement not available on web)
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Camera, Info } from 'lucide-react';

interface AutoMeasureButtonProps {
  onMeasurementComplete: (
    dimensions: { length_cm: number; width_cm: number; height_cm: number },
    photos?: File[]
  ) => void;
  className?: string;
}

export function AutoMeasureButton({ onMeasurementComplete, className }: AutoMeasureButtonProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if running in mobile app (Capacitor or Expo)
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      
      // Check for Capacitor
      const hasCapacitor = !!(window as any).Capacitor;
      
      // Check for Expo
      const hasExpo = !!(window as any).__expo || !!(global as any).__expo;
      
      // Check user agent for mobile web
      const isMobileWeb = /Android|iPhone|iPad/i.test(navigator.userAgent);
      
      return hasCapacitor || hasExpo || isMobileWeb;
    };

    setIsMobile(checkMobile());
  }, []);

  const handleClick = () => {
    if (!isMobile) {
      // Web: Show info message
      alert('Auto-measure is only available in the mobile app. Please download the SpareCarry app to use this feature.');
      return;
    }

    // Mobile: Open camera screen
    // For Capacitor (web app in native shell), use deep link
    // For Expo, use router navigation
    if ((window as any).Capacitor) {
      // Capacitor: Use app plugin to navigate
      const { App } = (window as any).Capacitor.Plugins;
      if (App) {
        // Navigate to auto-measure screen
        window.location.href = '/auto-measure';
      }
    } else {
      // Expo or mobile web: Use router or deep link
      // Store callback in sessionStorage
      sessionStorage.setItem('autoMeasureCallback', JSON.stringify({
        timestamp: Date.now(),
      }));
      
      // Navigate to auto-measure
      window.location.href = '/auto-measure';
    }
  };

  // Listen for measurement results from mobile app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'autoMeasureResult') {
        const { length_cm, width_cm, height_cm, photo } = event.data;
        // Photo will be handled via sessionStorage
        onMeasurementComplete({ length_cm, width_cm, height_cm });
      }
    };

    // Listen for postMessage from mobile app
    window.addEventListener('message', handleMessage);

    // Also check sessionStorage for results (fallback)
    const checkStorage = () => {
      const result = sessionStorage.getItem('autoMeasureResult');
      const photosData = sessionStorage.getItem('autoMeasurePhotos');
      
      if (result) {
        try {
          const dimensions = JSON.parse(result);
          const photoFiles: File[] = [];
          
          // Try to get photo files if available
          if (photosData) {
            try {
              const photos = JSON.parse(photosData);
              // For web, photos are stored as URIs - we'd need to fetch and convert
              // For now, we'll pass the dimensions and let the form handle photos separately
              // The photos will be handled by the form's photo upload system
            } catch (e) {
              console.warn('Error parsing auto-measure photos:', e);
            }
          }
          
          onMeasurementComplete(dimensions, photoFiles.length > 0 ? photoFiles : undefined);
          sessionStorage.removeItem('autoMeasureResult');
          if (photosData) {
            sessionStorage.removeItem('autoMeasurePhotos');
          }
        } catch (e) {
          console.error('Error parsing auto-measure result:', e);
        }
      }
    };

    // Check on mount and periodically
    checkStorage();
    const interval = setInterval(checkStorage, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [onMeasurementComplete]);

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className="w-full"
      >
        <Camera className="mr-2 h-4 w-4" />
        Auto-Fill Dimensions (Camera)
      </Button>
      {!isMobile && (
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Auto-measure is only available in the mobile app.
        </p>
      )}
    </div>
  );
}

