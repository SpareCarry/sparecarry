/**
 * AutoMeasureCamera - Camera screen for auto-measuring items
 * 
 * Lightweight implementation using expo-camera
 * Shows bounding box overlay and estimates dimensions
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useAutoMeasure } from './useAutoMeasure';
import { useAutoMeasurePhoto } from './useAutoMeasurePhoto';
import { useTiltDetection } from './useTiltDetection';
import { useReferenceObject } from './useReferenceObject';
import { MeasurementResult, CapturedPhoto, MultiFrameMeasurement } from './types';
import { useRouter } from 'expo-router';

// Conditional import for react-native-view-shot
let ViewShot: any = null;
if (typeof require !== 'undefined') {
  try {
    ViewShot = require('react-native-view-shot');
  } catch (e) {
    // react-native-view-shot not available
  }
}

const ViewShotComponent = ViewShot?.default || View;

interface AutoMeasureCameraProps {
  onMeasurementComplete?: (
    result: MeasurementResult,
    photos?: CapturedPhoto[]
  ) => void;
}

export function AutoMeasureCamera({ onMeasurementComplete }: AutoMeasureCameraProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementResult | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [captureProgress, setCaptureProgress] = useState<string>('');
  const [showReferenceGuide, setShowReferenceGuide] = useState(false);
  const [useReference, setUseReference] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const viewShotRef = useRef<any>(null);
  const frameCount = useRef(0);
  const capturedPhotosRef = useRef<{ main?: CapturedPhoto; side?: CapturedPhoto; reference?: CapturedPhoto }>({});

  // Tilt detection
  const { tilt, isAvailable: tiltAvailable, correctDimensions } = useTiltDetection({
    enabled: !isFrozen,
  });

  // Reference object detection
  const { referenceObject, detectReference, hasReference } = useReferenceObject();

  const { measurePhoto, measureMultiFrame, isProcessing } = useAutoMeasure({
    enabled: !isFrozen,
    multiFrameCount: 3,
    tiltData: tiltAvailable ? tilt : null,
    referenceObject: hasReference ? referenceObject : null,
    onMeasurement: (result) => {
      if (!isFrozen) {
        setCurrentMeasurement(result);
      }
    },
  });

  const { captureView, isCapturing: isCapturingPhoto } = useAutoMeasurePhoto({
    onPhotoCaptured: (photo) => {
      console.log('[AutoMeasureCamera] Photo captured:', photo);
    },
    onError: (error) => {
      console.error('[AutoMeasureCamera] Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo with overlay');
    },
  });

  // Request camera permission on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Handle frame processing (throttled)
  const handleCameraReady = useCallback(() => {
    // Frame processing happens in useAutoMeasure hook
    // This is just a placeholder for when camera is ready
  }, []);

  /**
   * Capture a single photo with overlay
   */
  const capturePhotoWithOverlay = useCallback(
    async (photoType: 'main' | 'side' | 'reference', measurement: MeasurementResult): Promise<CapturedPhoto | null> => {
      if (!viewShotRef.current || !ViewShot) {
        return null;
      }

      try {
        const photo = await captureView(viewShotRef.current, {
          ...measurement,
          dimensions: measurement.dimensions,
        });
        
        if (photo) {
          return {
            ...photo,
            photoType,
          };
        }
        return null;
      } catch (error) {
        console.warn(`[AutoMeasureCamera] Failed to capture ${photoType} photo:`, error);
        return null;
      }
    },
    [captureView]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || isFrozen) return;

    try {
      setIsCapturing(true);
      setIsFrozen(true);
      setCaptureProgress('Capturing main photo...');
      capturedPhotosRef.current = {};

      // Step 1: Capture main photo (front view)
      const mainPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!mainPhoto) {
        Alert.alert('Error', 'Failed to capture photo');
        setIsCapturing(false);
        setIsFrozen(false);
        setCaptureProgress('');
        return;
      }

      // Measure main photo
      const mainResult = await measurePhoto(mainPhoto.uri);
      if (!mainResult) {
        Alert.alert('Error', 'Failed to measure object. Please try again.');
        setIsCapturing(false);
        setIsFrozen(false);
        setCaptureProgress('');
        return;
      }

      setCurrentMeasurement(mainResult);

      // Capture main photo with overlay
      const mainCaptured = await capturePhotoWithOverlay('main', mainResult);
      if (mainCaptured) {
        capturedPhotosRef.current.main = mainCaptured;
      }

      // Step 2: Capture side photo (if user wants)
      setCaptureProgress('Capturing side photo...');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief pause

      const sidePhoto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (sidePhoto) {
        const sideResult = await measurePhoto(sidePhoto.uri);
        if (sideResult) {
          const sideCaptured = await capturePhotoWithOverlay('side', sideResult);
          if (sideCaptured) {
            capturedPhotosRef.current.side = sideCaptured;
          }
        }
      }

      // Step 3: Capture reference object photo (if reference is used)
      if (useReference && hasReference) {
        setCaptureProgress('Capturing reference photo...');
        await new Promise((resolve) => setTimeout(resolve, 500));

        const refPhoto = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (refPhoto) {
          const refResult = await measurePhoto(refPhoto.uri);
          if (refResult) {
            const refCaptured = await capturePhotoWithOverlay('reference', refResult);
            if (refCaptured) {
              capturedPhotosRef.current.reference = refCaptured;
            }
          }
        }
      }

      // Step 4: Multi-frame averaging (capture 3 frames for main measurement)
      setCaptureProgress('Averaging measurements...');
      const multiFrameUris = [mainPhoto.uri];
      if (sidePhoto) multiFrameUris.push(sidePhoto.uri);
      
      // Capture 1-2 more frames for averaging
      for (let i = 0; i < 2; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const extraPhoto = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        if (extraPhoto) {
          multiFrameUris.push(extraPhoto.uri);
        }
      }

      // Measure and average multiple frames
      const multiFrameResult = await measureMultiFrame(multiFrameUris.slice(0, 3));
      const finalResult = multiFrameResult?.referenceCalibrated || multiFrameResult?.tiltCorrected || mainResult;

      setCurrentMeasurement(finalResult);
      setCaptureProgress('');

      // Show result
      const refInfo = hasReference ? `\nReference: ${referenceObject?.type || 'none'}` : '';
      const tiltInfo = tiltAvailable ? `\nTilt: ${tilt.pitch.toFixed(1)}°, ${tilt.roll.toFixed(1)}°` : '';
      
      Alert.alert(
        'Measurement Complete',
        `Estimated dimensions:\nLength: ${finalResult.dimensions.length.toFixed(1)} cm\nWidth: ${finalResult.dimensions.width.toFixed(1)} cm\nHeight: ${finalResult.dimensions.height.toFixed(1)} cm\n\nConfidence: ${(finalResult.confidence * 100).toFixed(0)}%${refInfo}${tiltInfo}\n\nPhotos captured: ${Object.keys(capturedPhotosRef.current).length}`,
        [
          {
            text: 'Retake',
            style: 'cancel',
            onPress: () => {
              setIsCapturing(false);
              setIsFrozen(false);
              setCurrentMeasurement(null);
              setCaptureProgress('');
              capturedPhotosRef.current = {};
            },
          },
          {
            text: 'Use This',
            onPress: () => {
              // Convert photos object to array format
              const photosArray: CapturedPhoto[] = [];
              if (capturedPhotosRef.current.main) photosArray.push(capturedPhotosRef.current.main);
              if (capturedPhotosRef.current.side) photosArray.push(capturedPhotosRef.current.side);
              if (capturedPhotosRef.current.reference) photosArray.push(capturedPhotosRef.current.reference);
              
              // Call with array format (matches screen expectation)
              onMeasurementComplete?.(finalResult, photosArray.length > 0 ? photosArray : undefined);
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('[AutoMeasureCamera] Error capturing:', error);
      Alert.alert('Error', 'Failed to capture photos');
      setIsCapturing(false);
      setIsFrozen(false);
      setCaptureProgress('');
    }
  }, [
    cameraRef,
    isCapturing,
    isFrozen,
    measurePhoto,
    measureMultiFrame,
    capturePhotoWithOverlay,
    useReference,
    hasReference,
    referenceObject,
    tiltAvailable,
    tilt,
    onMeasurementComplete,
    router,
  ]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required for auto-measure</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ViewShotComponent
      ref={viewShotRef}
      style={styles.container}
      options={{
        format: 'jpg',
        quality: 0.9,
      }}
    >
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={handleCameraReady}
        paused={isFrozen}
      >
        {/* Bounding box overlay */}
        {currentMeasurement?.boundingBox && (
          <View
            style={[
              styles.boundingBox,
              {
                left: currentMeasurement.boundingBox.x,
                top: currentMeasurement.boundingBox.y,
                width: currentMeasurement.boundingBox.width,
                height: currentMeasurement.boundingBox.height,
              },
            ]}
          >
            <View style={styles.boundingBoxBorder} />
          </View>
        )}

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          {captureProgress ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color="#14b8a6" />
              <Text style={styles.statusText}>{captureProgress}</Text>
            </View>
          ) : isProcessing ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color="#14b8a6" />
              <Text style={styles.statusText}>Detecting size...</Text>
            </View>
          ) : currentMeasurement ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>
                L: {currentMeasurement.dimensions.length.toFixed(1)}cm W:{' '}
                {currentMeasurement.dimensions.width.toFixed(1)}cm H:{' '}
                {currentMeasurement.dimensions.height.toFixed(1)}cm
              </Text>
              {hasReference && (
                <Text style={styles.referenceText}>
                  Reference: {referenceObject?.type || 'detected'}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Reference object guide */}
        {showReferenceGuide && (
          <View style={styles.referenceGuide}>
            <Text style={styles.referenceGuideTitle}>Reference Object Guide</Text>
            <Text style={styles.referenceGuideText}>
              Place a credit card, coin, or sheet of paper next to the item for more accurate measurement.
            </Text>
            <View style={styles.referenceOptions}>
              <TouchableOpacity
                style={[styles.referenceOption, useReference && styles.referenceOptionActive]}
                onPress={() => setUseReference(!useReference)}
              >
                <Text style={styles.referenceOptionText}>
                  {useReference ? '✓ Use Reference' : 'Use Reference'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.referenceOption}
                onPress={() => setShowReferenceGuide(false)}
              >
                <Text style={styles.referenceOptionText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.referenceButton}
            onPress={() => setShowReferenceGuide(!showReferenceGuide)}
          >
            <Text style={styles.referenceButtonText}>Reference</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, (isCapturing || isCapturingPhoto) && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isCapturing || isCapturingPhoto}
          >
            {(isCapturing || isCapturingPhoto) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.captureButtonText}>Auto-Measure</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </ViewShotComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#14b8a6',
    borderStyle: 'dashed',
  },
  boundingBoxBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  statusContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  flipButton: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  flipButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  captureButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#14b8a6',
    borderRadius: 30,
    minWidth: 150,
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  referenceText: {
    color: '#14b8a6',
    fontSize: 12,
    marginTop: 4,
  },
  referenceGuide: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  referenceGuideTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  referenceGuideText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  referenceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  referenceOption: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  referenceOptionActive: {
    backgroundColor: '#14b8a6',
  },
  referenceOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  referenceButton: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  referenceButtonActive: {
    backgroundColor: '#14b8a6',
  },
  referenceButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

