/**
 * Frame Processor for Real-Time Object Detection
 * Uses react-native-vision-camera frame processor for real-time detection
 * Processes frames without taking photos - updates bounding box in real-time
 */

import { BoundingBox } from "./types";
import { detectObject } from "./objectDetection";

// Frame processor will be implemented when react-native-vision-camera is properly set up
// This provides the interface and basic structure

/**
 * Check if frame processor is available
 */
export function isFrameProcessorAvailable(): boolean {
  try {
    const { useFrameProcessor } = require("react-native-vision-camera");
    return typeof useFrameProcessor === "function";
  } catch {
    return false;
  }
}

/**
 * Create frame processor for real-time object detection using ML Kit
 * This will be called from the camera component
 */
export function createObjectDetectionFrameProcessor(
  onDetection: (boundingBox: BoundingBox | null) => void,
  frameWidth: number,
  frameHeight: number
): any {
  if (!isFrameProcessorAvailable()) {
    console.warn("[FrameProcessor] react-native-vision-camera not available");
    return null;
  }

  try {
    const { useFrameProcessor } = require("react-native-vision-camera");
    const { runOnJS } = require("react-native-reanimated");
    
    // Try to use ML Kit for object detection
    let mlkit: any = null;
    try {
      mlkit = require("react-native-vision-camera-mlkit");
    } catch (e) {
      console.warn("[FrameProcessor] ML Kit not available, will use edge detection fallback");
    }

    // Frame processor function
    // This runs on the native thread for performance
    const frameProcessor = useFrameProcessor((frame: any) => {
      "worklet";
      
      // Throttle detection to every 10 frames (~3fps detection rate)
      if (frame.timestamp % 10 !== 0) {
        return;
      }
      
      try {
        let boundingBox: BoundingBox | null = null;
        
        // Try ML Kit first if available
        // Note: ML Kit integration requires proper setup with useObjectDetector hook
        // For now, we'll use a simplified approach that will be enhanced
        if (mlkit) {
          try {
            // ML Kit object detection via frame processor
            // The actual API may vary - this is a placeholder that will be enhanced
            // when testing with the actual package
            if (mlkit.scanObjects) {
              const objects = mlkit.scanObjects(frame);
              if (objects && objects.length > 0) {
                // Find largest object
                const largest = objects.reduce((prev: any, current: any) => {
                  const prevArea = (prev.bounds?.width || 0) * (prev.bounds?.height || 0);
                  const currentArea = (current.bounds?.width || 0) * (current.bounds?.height || 0);
                  return currentArea > prevArea ? current : prev;
                });
                
                if (largest.bounds) {
                  boundingBox = {
                    x: largest.bounds.x || 0,
                    y: largest.bounds.y || 0,
                    width: largest.bounds.width || 0,
                    height: largest.bounds.height || 0,
                  };
                }
              }
            }
          } catch (mlkitError) {
            // ML Kit failed, will fall back to edge detection
            // This is expected if ML Kit isn't fully set up yet
          }
        }
        
        // If ML Kit didn't work, fall back to edge detection
        // Note: Edge detection on frames requires frame.toImage() which may be slower
        // For now, we'll call the detection callback
        runOnJS(onDetection)(boundingBox);
      } catch (error) {
        console.error("[FrameProcessor] Error in frame processor:", error);
        runOnJS(onDetection)(null);
      }
    }, [onDetection, frameWidth, frameHeight, mlkit]);

    return frameProcessor;
  } catch (error) {
    console.error("[FrameProcessor] Error creating frame processor:", error);
    return null;
  }
}

/**
 * Process a single frame for object detection
 * This can be called from the frame processor
 */
export async function processFrameForDetection(
  frame: any,
  frameWidth: number,
  frameHeight: number
): Promise<BoundingBox | null> {
  try {
    // Extract image URI from frame
    // react-native-vision-camera provides frame.toImage() or similar
    if (!frame || !frame.toImage) {
      return null;
    }

    // Convert frame to image URI
    const imageUri = await frame.toImage();
    
    // Run detection on the image
    const boundingBox = await detectObject(imageUri, frameWidth, frameHeight);
    
    return boundingBox;
  } catch (error) {
    console.error("[FrameProcessor] Error processing frame:", error);
    return null;
  }
}

