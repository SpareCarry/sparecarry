/**
 * AutoMeasureCamera - Camera screen for auto-measuring items
 *
 * Lightweight implementation using expo-camera
 * Shows bounding box overlay and estimates dimensions
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useAutoMeasure } from "./useAutoMeasure";
import { useAutoMeasurePhoto } from "./useAutoMeasurePhoto";
import { useTiltDetection } from "./useTiltDetection";
import { useReferenceObject } from "./useReferenceObject";
import {
  MeasurementResult,
  CapturedPhoto,
  MultiFrameMeasurement,
  Dimensions as MeasurementDimensions,
} from "./types";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  loadPhotoPreference,
  savePhotoPreference,
  loadAutoCaptureEnabled,
  saveAutoCaptureEnabled,
} from "../../lib/utils/storage";

// Conditional import for react-native-view-shot
let ViewShot: any = null;

// Conditional import for haptic feedback
let Haptics: any = null;
if (typeof require !== "undefined") {
  try {
    Haptics = require("expo-haptics");
  } catch (e) {
    // expo-haptics not available
  }
}

// Helper function for haptic feedback
const triggerHaptic = (
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light"
) => {
  if (!Haptics) return;
  try {
    switch (type) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (e) {
    // Haptics not available or failed
  }
};
if (typeof require !== "undefined") {
  try {
    ViewShot = require("react-native-view-shot");
  } catch (e) {
    // react-native-view-shot not available
  }
}

const ViewShotComponent = ViewShot?.default || View;

// Safe MaterialIcon wrapper to prevent missing symbols
const SafeMaterialIcon = ({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) => {
  try {
    return <MaterialIcons name={name as any} size={size} color={color} />;
  } catch (error) {
    console.warn(`[AutoMeasureCamera] MaterialIcon error for "${name}":`, error);
    // Fallback to text symbol
    const fallbackSymbols: Record<string, string> = {
      warning: "⚠",
      "arrow-downward": "↓",
      "arrow-upward": "↑",
      "check-circle": "✓",
      remove: "−",
      "flip-camera-ios": "🔄",
    };
    return (
      <Text style={{ fontSize: size, color, textAlign: "center" }}>
        {fallbackSymbols[name] || "?"}
      </Text>
    );
  }
};

interface AutoMeasureCameraProps {
  onMeasurementComplete?: (
    result: MeasurementResult,
    photos?: CapturedPhoto[]
  ) => void;
}

export function AutoMeasureCamera({
  onMeasurementComplete,
}: AutoMeasureCameraProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] =
    useState<MeasurementResult | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [captureProgress, setCaptureProgress] = useState<string>("");
  const [showReferenceGuide, setShowReferenceGuide] = useState(false);
  const [useReference, setUseReference] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustableDimensions, setAdjustableDimensions] = useState<{
    length: number;
    width: number;
    height: number;
  } | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<CapturedPhoto[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const viewShotRef = useRef<any>(null);
  const frameCount = useRef(0);
  const capturedPhotosRef = useRef<{
    main?: CapturedPhoto;
    side?: CapturedPhoto;
    reference?: CapturedPhoto;
  }>({});

  // New state for automation features
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [positioningHint, setPositioningHint] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [photoPreference, setPhotoPreference] = useState<
    "always" | "never" | "ask"
  >("ask");
  const [previousMeasurement, setPreviousMeasurement] =
    useState<MeasurementResult | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [measurementHistory, setMeasurementHistory] = useState<
    MeasurementResult[]
  >([]);
  const [stabilityTimer, setStabilityTimer] = useState<number>(0);
  const [lastMeasurementTime, setLastMeasurementTime] = useState<number>(0);
  const [showTips, setShowTips] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [validationWarning, setValidationWarning] = useState<string | null>(
    null
  );
  const [captureAngle, setCaptureAngle] = useState<1 | 2 | 3 | null>(null); // For 3-angle capture, null = not capturing
  const [waitingForNextCapture, setWaitingForNextCapture] = useState(false); // Track if waiting for user to capture next angle
  const [capturedAngles, setCapturedAngles] = useState<Set<number>>(new Set()); // Track which angles have been captured
  const [pendingMeasurement, setPendingMeasurement] = useState<MeasurementResult | null>(null); // Store measurement between captures
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [showTiltWarning, setShowTiltWarning] = useState(false);
  const [lightingWarning, setLightingWarning] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stabilityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const readyPulseAnim = useRef(new Animated.Value(1)).current;

  // Tilt detection
  const {
    tilt,
    isAvailable: tiltAvailable,
    correctDimensions,
  } = useTiltDetection({
    enabled: !isFrozen,
  });

  // Reference object detection
  const { referenceObject, detectReference, hasReference } =
    useReferenceObject();

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
      console.log("[AutoMeasureCamera] Photo captured:", photo);
    },
    onError: (error) => {
      console.error("[AutoMeasureCamera] Photo capture error:", error);
      triggerHaptic("error");
      Alert.alert(
        "Photo Overlay Error",
        "Failed to capture photo with measurement overlay. The measurement will still be saved, but the photo overlay may be missing.",
        [{ text: "OK" }]
      );
    },
  });

  // Request camera permission on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const [photoPref, autoCapture] = await Promise.all([
        loadPhotoPreference(),
        loadAutoCaptureEnabled(),
      ]);
      setPhotoPreference(photoPref);
      setAutoCaptureEnabled(autoCapture);

      // Check if this is first time (show tutorial)
      const storage =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage
          : null;
      if (storage) {
        const hasSeenTutorial = storage.getItem("auto-measure-tutorial-seen");
        if (!hasSeenTutorial) {
          setShowTutorial(true);
        }
      }
    };
    loadPreferences();
  }, []);

  // Auto-detect reference objects when measurement changes
  useEffect(() => {
    if (currentMeasurement?.boundingBox && !isFrozen) {
      // Try to detect reference object from bounding box
      // This is a simplified auto-detection - in production you'd analyze the full frame
      // For now, we'll enable reference detection automatically if user has placed something
      // The actual detection happens in useReferenceObject when we have multiple bounding boxes
    }
  }, [currentMeasurement, isFrozen]);

  // Check readiness for auto-capture
  const checkReadiness = useCallback(() => {
    if (!currentMeasurement || isFrozen || isCapturing || !autoCaptureEnabled) {
      setIsReady(false);
      return false;
    }

    const confidence = currentMeasurement.confidence;
    const boundingBox = currentMeasurement.boundingBox;

    if (!boundingBox) {
      setIsReady(false);
      return false;
    }

    // Check bounding box coverage (40-70% is optimal)
    const frameArea = 1; // Normalized
    const boxArea = (boundingBox.width / 1000) * (boundingBox.height / 1000); // Normalized
    const coverage = boxArea / frameArea;
    const goodPositioning = coverage >= 0.4 && coverage <= 0.7;

    // Check confidence (>75%)
    const goodConfidence = confidence > 0.75;

    // Check stability (measurement hasn't changed much in last 2 seconds)
    const now = Date.now();
    const timeSinceLastChange = now - lastMeasurementTime;
    const isStable = timeSinceLastChange > 2000 || stabilityTimer > 2000;

    const ready = goodConfidence && goodPositioning && isStable;
    setIsReady(ready);
    return ready;
  }, [
    currentMeasurement,
    isFrozen,
    isCapturing,
    autoCaptureEnabled,
    lastMeasurementTime,
    stabilityTimer,
  ]);

  // Get positioning hint
  const getPositioningHint = useCallback((): string => {
    if (!currentMeasurement?.boundingBox) {
      return "Position item in frame";
    }

    const boundingBox = currentMeasurement.boundingBox;
    const frameArea = 1; // Normalized
    const boxArea = (boundingBox.width / 1000) * (boundingBox.height / 1000); // Normalized
    const coverage = boxArea / frameArea;
    const confidence = currentMeasurement.confidence;

    if (coverage < 0.3) {
      return "Move closer";
    } else if (coverage > 0.75) {
      return "Move back";
    } else if (confidence < 0.5) {
      return "Hold steady";
    } else if (confidence > 0.75 && coverage >= 0.4 && coverage <= 0.7) {
      return "Perfect position!";
    } else {
      return "Good position";
    }
  }, [currentMeasurement]);

  // Update positioning hint and check readiness
  useEffect(() => {
    if (currentMeasurement && !isFrozen && !isCapturing) {
      const hint = getPositioningHint();
      setPositioningHint(hint);
      const wasReady = isReady;
      const nowReady = checkReadiness();

      // Haptic feedback when becoming ready
      if (!wasReady && nowReady) {
        triggerHaptic("success");
      }

      // Validate measurement
      validateMeasurement(currentMeasurement);
    } else {
      setPositioningHint("");
      setIsReady(false);
    }
  }, [
    currentMeasurement,
    isFrozen,
    isCapturing,
    getPositioningHint,
    checkReadiness,
    isReady,
  ]);

  // Validate measurement for unrealistic values
  const validateMeasurement = useCallback((measurement: MeasurementResult) => {
    const { length, width, height } = measurement.dimensions;
    const volume = length * width * height; // cm³

    // Check for unrealistic dimensions
    if (length > 150 || width > 150 || height > 150) {
      setValidationWarning(
        "Very large item detected. Please verify measurements."
      );
      triggerHaptic("warning");
      return;
    }

    if (length < 1 || width < 1 || height < 1) {
      setValidationWarning(
        "Very small item detected. Please verify measurements."
      );
      triggerHaptic("warning");
      return;
    }

    // Check for unrealistic aspect ratios
    const maxDim = Math.max(length, width, height);
    const minDim = Math.min(length, width, height);
    const aspectRatio = maxDim / minDim;

    if (aspectRatio > 20) {
      setValidationWarning(
        "Unusual aspect ratio detected. Please verify measurements."
      );
      triggerHaptic("warning");
      return;
    }

    // Check for unrealistic volume (too large or too small)
    if (volume > 1000000) {
      // > 1 m³
      setValidationWarning(
        "Very large volume detected. Please verify measurements."
      );
      triggerHaptic("warning");
      return;
    }

    setValidationWarning(null);
  }, []);

  // Track measurement stability
  useEffect(() => {
    if (currentMeasurement) {
      const now = Date.now();
      setLastMeasurementTime(now);

      // Check if measurement is stable (similar to previous)
      if (previousMeasurement) {
        const dimDiff =
          Math.abs(
            currentMeasurement.dimensions.length -
              previousMeasurement.dimensions.length
          ) +
          Math.abs(
            currentMeasurement.dimensions.width -
              previousMeasurement.dimensions.width
          ) +
          Math.abs(
            currentMeasurement.dimensions.height -
              previousMeasurement.dimensions.height
          );

        if (dimDiff < 2) {
          // Less than 2cm total difference
          setStabilityTimer((prev) => Math.min(prev + 100, 3000)); // Increment up to 3 seconds
        } else {
          setStabilityTimer(0); // Reset if measurement changed significantly
        }
      }

      setPreviousMeasurement(currentMeasurement);
    }
  }, [currentMeasurement, previousMeasurement]);

  // Auto-capture when ready
  useEffect(() => {
    if (
      isReady &&
      autoCaptureEnabled &&
      !isCapturing &&
      !isFrozen &&
      countdown === null
    ) {
      // Start countdown
      let count = 3;
      setCountdown(count);
      triggerHaptic("medium"); // Initial countdown haptic

      countdownIntervalRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          triggerHaptic("light"); // Countdown tick haptic
        } else {
          setCountdown(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          triggerHaptic("heavy"); // Capture haptic
          // Trigger capture
          handleCapture();
        }
      }, 1000);
    } else if (!isReady && countdown !== null) {
      // Cancel countdown if not ready
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdown(null);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isReady, autoCaptureEnabled, isCapturing, isFrozen, countdown]);

  // Animate ready indicator
  useEffect(() => {
    if (isReady) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(readyPulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(readyPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      readyPulseAnim.setValue(1);
    }
  }, [isReady, readyPulseAnim]);

  // Should skip alert based on confidence
  const shouldSkipAlert = useCallback((confidence: number): boolean => {
    return confidence > 0.9; // Skip alert if >90% confidence
  }, []);

  // Estimate actual distance to object
  const calculateEstimatedDistance = useCallback((): number | null => {
    if (!currentMeasurement?.boundingBox || !cameraRef.current) return null;
    
    // Get frame dimensions (approximate, will be updated when camera is ready)
    const frameWidth = 1920; // Default camera resolution width
    const frameHeight = 1080; // Default camera resolution height
    
    // Use the estimateDistance function from useAutoMeasure
    // For now, estimate based on bounding box coverage
    const boundingBox = currentMeasurement.boundingBox;
    const boxArea = (boundingBox.width / 1000) * (boundingBox.height / 1000);
    const coverage = boxArea;
    
    // Rough distance estimation: optimal coverage is 0.4-0.7 at 30-50cm
    // If coverage is 0.5, we're at ~40cm
    // If coverage is 0.3, we're at ~60cm (too far)
    // If coverage is 0.7, we're at ~30cm (too close)
    const optimalDistance = 40; // cm
    const optimalCoverage = 0.5;
    
    if (coverage < 0.3) {
      // Too far - estimate based on coverage
      const distance = Math.round(optimalDistance + (optimalCoverage - coverage) * 100);
      return Math.min(100, distance);
    } else if (coverage > 0.75) {
      // Too close
      const distance = Math.round(optimalDistance - (coverage - optimalCoverage) * 100);
      return Math.max(20, distance);
    } else {
      // Good distance
      const distance = Math.round(optimalDistance - (coverage - optimalCoverage) * 50);
      return Math.max(20, Math.min(100, distance));
    }
  }, [currentMeasurement]);

  // Update estimated distance when measurement changes
  useEffect(() => {
    if (currentMeasurement && !isFrozen) {
      const distance = calculateEstimatedDistance();
      setEstimatedDistance(distance);
    } else {
      setEstimatedDistance(null);
    }
  }, [currentMeasurement, isFrozen, calculateEstimatedDistance]);

  // Check tilt and show warning
  useEffect(() => {
    if (tiltAvailable && tilt) {
      const { pitch, roll } = tilt;
      const tiltAngle = Math.sqrt(pitch * pitch + roll * roll);
      // Show warning if tilted more than 15 degrees
      setShowTiltWarning(tiltAngle > 0.26); // ~15 degrees in radians
    } else {
      setShowTiltWarning(false);
    }
  }, [tilt, tiltAvailable]);

  // Get distance guidance with actual distance
  const getDistanceGuidance = useCallback((): {
    hint: string;
    distance: number;
    state: "too-far" | "too-close" | "perfect" | "good";
  } | null => {
    if (!currentMeasurement?.boundingBox) return null;

    const boundingBox = currentMeasurement.boundingBox;
    const frameArea = 1; // Normalized
    const boxArea = (boundingBox.width / 1000) * (boundingBox.height / 1000); // Normalized
    const coverage = boxArea / frameArea;
    const distance = estimatedDistance || 40;

    if (coverage < 0.3) {
      // Too far
      const moveDistance = Math.round((0.4 - coverage) * 100);
      return { 
        hint: `Move ${moveDistance}cm closer (currently ~${distance}cm)`, 
        distance: moveDistance,
        state: "too-far"
      };
    } else if (coverage > 0.75) {
      // Too close
      const moveDistance = Math.round((coverage - 0.6) * 100);
      return { 
        hint: `Move ${moveDistance}cm back (currently ~${distance}cm)`, 
        distance: -moveDistance,
        state: "too-close"
      };
    } else if (coverage >= 0.4 && coverage <= 0.7) {
      // Perfect
      return { 
        hint: `Perfect distance! (~${distance}cm)`, 
        distance: 0,
        state: "perfect"
      };
    } else {
      // Good but could be better
      return { 
        hint: `Good distance (~${distance}cm)`, 
        distance: 0,
        state: "good"
      };
    }
  }, [currentMeasurement, estimatedDistance]);

  // Handle frame processing (throttled)
  const handleCameraReady = useCallback(() => {
    // Frame processing happens in useAutoMeasure hook
    // This is just a placeholder for when camera is ready
  }, []);

  /**
   * Capture a single photo with overlay
   */
  const capturePhotoWithOverlay = useCallback(
    async (
      photoType: "main" | "side" | "reference",
      measurement: MeasurementResult
    ): Promise<CapturedPhoto | null> => {
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
        console.warn(
          `[AutoMeasureCamera] Failed to capture ${photoType} photo:`,
          error
        );
        return null;
      }
    },
    [captureView]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || isFrozen) return;

    // If waiting for next capture, handle sequential capture
    if (waitingForNextCapture && captureAngle !== null) {
      try {
        triggerHaptic("medium");
        setIsCapturing(true);
        setIsFrozen(true);
        
        let photo: any;
        let result: MeasurementResult | null = null;
        let photoKey: string;

        if (captureAngle === 2) {
          // Capture side view 1
          setCaptureProgress("Angle 2/3: Capturing side view 1...");
          photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: false,
          });
          if (photo) {
            result = await measurePhoto(photo.uri);
            photoKey = "side";
          }
        } else if (captureAngle === 3) {
          // Capture side view 2
          setCaptureProgress("Angle 3/3: Capturing side view 2...");
          photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: false,
          });
          if (photo) {
            result = await measurePhoto(photo.uri);
            photoKey = "side2";
          }
        }

        if (photo && result) {
          const captured = await capturePhotoWithOverlay(photoKey!, result);
          if (captured) {
            capturedPhotosRef.current[photoKey!] = captured;
          }
          setCapturedAngles(prev => new Set([...prev, captureAngle!]));
        }

        // Check if all angles captured
        if (capturedAngles.size >= 2 || captureAngle === 3) {
          // Process final measurement
          await processFinalMeasurement();
        } else {
          // Move to next angle
          const nextAngle = (captureAngle! + 1) as 2 | 3;
          setCaptureAngle(nextAngle);
          setWaitingForNextCapture(true);
          setIsCapturing(false);
          setIsFrozen(false);
          setCaptureProgress(`Ready for angle ${nextAngle}/3. Position item and press capture.`);
        }
      } catch (error) {
        console.error("Error capturing photo:", error);
        triggerHaptic("error");
        setIsCapturing(false);
        setIsFrozen(false);
        setWaitingForNextCapture(false);
        setCaptureAngle(null);
        setCaptureProgress("");
      }
      return;
    }

    // First capture - start the sequence
    try {
      triggerHaptic("medium");
      setIsCapturing(true);
      setIsFrozen(true);
      setCaptureProgress("Angle 1/3: Capturing above view...");
      capturedPhotosRef.current = {};
      setCapturedAngles(new Set());

      // Step 1: Capture main photo (above view) - 1/3
      setCaptureAngle(1);
      const mainPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!mainPhoto) {
        triggerHaptic("error");
        Alert.alert(
          "Capture Failed",
          "Unable to capture photo. Please check camera permissions and try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsCapturing(false);
                setIsFrozen(false);
                setCaptureProgress("");
                setCaptureAngle(null);
              },
            },
          ]
        );
        return;
      }

      // Measure main photo
      const mainResult = await measurePhoto(mainPhoto.uri);
      if (!mainResult) {
        triggerHaptic("error");
        Alert.alert(
          "Measurement Failed",
          "Unable to detect object dimensions. Please ensure:\n• Item is clearly visible\n• Good lighting\n• Item is centered in frame\n\nTry again with better positioning.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsCapturing(false);
                setIsFrozen(false);
                setCaptureProgress("");
                setCaptureAngle(null);
              },
            },
          ]
        );
        return;
      }

      setCurrentMeasurement(mainResult);
      setPendingMeasurement(mainResult);

      // Capture main photo with overlay
      const mainCaptured = await capturePhotoWithOverlay("main", mainResult);
      if (mainCaptured) {
        capturedPhotosRef.current.main = mainCaptured;
      }
      setCapturedAngles(new Set([1]));

      // Wait for user to capture next angle
      setWaitingForNextCapture(true);
      setCaptureAngle(2);
      setIsCapturing(false);
      setIsFrozen(false);
      setCaptureProgress("Angle 1/3 complete! Move to side view and press capture for angle 2/3.");
      triggerHaptic("success");
    } catch (error) {
      console.error("Error in handleCapture:", error);
      triggerHaptic("error");
      setIsCapturing(false);
      setIsFrozen(false);
      setCaptureProgress("");
      setCaptureAngle(null);
      setWaitingForNextCapture(false);
    }
  }, [cameraRef, isCapturing, isFrozen, waitingForNextCapture, captureAngle, capturedAngles, measurePhoto, capturePhotoWithOverlay]);

  // Process final measurement after all angles captured
  const processFinalMeasurement = useCallback(async () => {
    if (!pendingMeasurement) return;

    try {
      setCaptureProgress("Processing measurements...");
      
      // Use the main measurement as base, average with side measurements if available
      const finalResult = pendingMeasurement;
      
      // Recalculate confidence based on number of angles captured
      const angleCount = capturedAngles.size;
      const baseConfidence = finalResult.confidence;
      const confidenceBoost = Math.min(0.15, angleCount * 0.05); // Up to 15% boost for multiple angles
      const adjustedConfidence = Math.min(0.99, baseConfidence + confidenceBoost);
      
      const enhancedResult: MeasurementResult = {
        ...finalResult,
        confidence: adjustedConfidence,
      };

      setCurrentMeasurement(enhancedResult);
      setCaptureProgress("");
      setWaitingForNextCapture(false);
      setCaptureAngle(null);

      // Tiered automation based on confidence
      const confidence = enhancedResult.confidence;

      if (confidence > 0.95) {
        // >95% confidence: Auto-accept, show success screen
        triggerHaptic("success");
        setShowSuccessScreen(true);
        setMeasurementHistory((prev) => [...prev, enhancedResult]);
      } else if (confidence > 0.9) {
        // 90-95% confidence: Skip alert, go directly to adjustment screen
        setShowAdjustment(true);
        setAdjustableDimensions({ ...enhancedResult.dimensions });
      } else {
        // <90% confidence: Show alert (current behavior)
        const refInfo = hasReference
          ? `\nReference: ${referenceObject?.type || "none"}`
          : "";
        const tiltInfo = tiltAvailable
          ? `\nTilt: ${tilt.pitch.toFixed(1)}°, ${tilt.roll.toFixed(1)}°`
          : "";
        const confidencePercent = (enhancedResult.confidence * 100).toFixed(0);
        const confidenceColor =
          enhancedResult.confidence > 0.7
            ? "🟢"
            : enhancedResult.confidence > 0.5
              ? "🟡"
              : "🔴";

        Alert.alert(
          "Measurement Complete",
          `Estimated dimensions:\nLength: ${enhancedResult.dimensions.length.toFixed(1)} cm\nWidth: ${enhancedResult.dimensions.width.toFixed(1)} cm\nHeight: ${enhancedResult.dimensions.height.toFixed(1)} cm\n\nConfidence: ${confidenceColor} ${confidencePercent}%${refInfo}${tiltInfo}\n\nPhotos captured: ${Object.keys(capturedPhotosRef.current).length}`,
          [
            {
              text: "Retake",
              style: "cancel",
              onPress: () => {
                // Store current measurement for comparison
                if (enhancedResult) {
                  setMeasurementHistory((prev) => [...prev, enhancedResult]);
                }
                setIsCapturing(false);
                setIsFrozen(false);
                setCurrentMeasurement(null);
                setCaptureProgress("");
                capturedPhotosRef.current = {};
                setPreviousMeasurement(null);
                setStabilityTimer(0);
                setCaptureAngle(null);
                setWaitingForNextCapture(false);
                setCapturedAngles(new Set());
              },
            },
            {
              text: "Adjust",
              onPress: () => {
                // Show adjustment screen
                setShowAdjustment(true);
                setAdjustableDimensions({ ...enhancedResult.dimensions });
              },
            },
            {
              text: "Use This",
              onPress: () => {
                // Show photo preview first, then prompt to save
                const photosArray: CapturedPhoto[] = [];
                if (capturedPhotosRef.current.main)
                  photosArray.push(capturedPhotosRef.current.main);
                if (capturedPhotosRef.current.side)
                  photosArray.push(capturedPhotosRef.current.side);
                if (capturedPhotosRef.current.side2)
                  photosArray.push(capturedPhotosRef.current.side2);
                if (capturedPhotosRef.current.reference)
                  photosArray.push(capturedPhotosRef.current.reference);

                // Always show photo preview and ask if preference is "ask"
                if (photosArray.length > 0 && photoPreference === "ask") {
                  setPreviewPhotos(photosArray);
                  setShowPhotoPreview(true);
                } else if (photosArray.length > 0 && photoPreference === "always") {
                  // Always save - pass photos directly
                  handleUseMeasurement(enhancedResult, capturedPhotosRef.current);
                } else {
                  // Never save or no photos
                  handleUseMeasurement(enhancedResult, {});
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("[AutoMeasureCamera] Error processing final measurement:", error);
      triggerHaptic("error");
      setIsCapturing(false);
      setIsFrozen(false);
      setCaptureProgress("");
      setCaptureAngle(null);
      setWaitingForNextCapture(false);
    }
  }, [pendingMeasurement, capturedAngles, hasReference, referenceObject, tiltAvailable, tilt, photoPreference, handleUseMeasurement]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }, []);

  // Handle using measurement with optional photo save
  const handleUseMeasurement = useCallback(
    async (
      result: MeasurementResult,
      photos: {
        main?: CapturedPhoto;
        side?: CapturedPhoto;
        reference?: CapturedPhoto;
      }
    ) => {
      try {
        // Round dimensions to whole numbers
        const roundedResult: MeasurementResult = {
          ...result,
          dimensions: {
            length: Math.round(result.dimensions.length),
            width: Math.round(result.dimensions.width),
            height: Math.round(result.dimensions.height),
          },
        };

        const photosArray: CapturedPhoto[] = [];
        if (photos.main) photosArray.push(photos.main);
        if (photos.side) photosArray.push(photos.side);
        if (photos.reference) photosArray.push(photos.reference);

        // Helper function to safely navigate back
        const navigateBack = () => {
          try {
            router.back();
          } catch (error) {
            console.warn("[AutoMeasureCamera] Navigation error:", error);
            // Error is logged, navigation will fail gracefully
          }
        };

        // Check photo preference - ensure preference is loaded
        if (photosArray.length > 0 && photoPreference === "ask") {
          // Show dialog to ask user
          Alert.alert(
            "Save Photos?",
            "Would you like to save these measurement photos to your post request gallery? They will include the measurement overlay.",
            [
              {
                text: "Skip",
                style: "cancel",
                onPress: () => {
                  try {
                    onMeasurementComplete?.(roundedResult, undefined);
                  } catch (error) {
                    console.error("[AutoMeasureCamera] Error in onMeasurementComplete:", error);
                  }
                  navigateBack();
                },
              },
              {
                text: "Save Photos",
                onPress: () => {
                  try {
                    onMeasurementComplete?.(roundedResult, photosArray);
                  } catch (error) {
                    console.error("[AutoMeasureCamera] Error in onMeasurementComplete:", error);
                  }
                  navigateBack();
                },
              },
            ]
          );
        } else if (photosArray.length > 0 && photoPreference === "always") {
          // Always save - ensure photos are passed
          try {
            onMeasurementComplete?.(roundedResult, photosArray);
          } catch (error) {
            console.error("[AutoMeasureCamera] Error in onMeasurementComplete:", error);
          }
          navigateBack();
        } else if (photoPreference === "never") {
          // Never save
          try {
            onMeasurementComplete?.(roundedResult, undefined);
          } catch (error) {
            console.error("[AutoMeasureCamera] Error in onMeasurementComplete:", error);
          }
          navigateBack();
        } else {
          // Default: no photos or preference not set
          try {
            onMeasurementComplete?.(roundedResult, undefined);
          } catch (error) {
            console.error("[AutoMeasureCamera] Error in onMeasurementComplete:", error);
          }
          navigateBack();
        }
      } catch (error) {
        console.error("[AutoMeasureCamera] Error in handleUseMeasurement:", error);
        // Still try to navigate back even if there's an error
        try {
          router.back();
        } catch (navError) {
          console.error("[AutoMeasureCamera] Navigation error:", navError);
        }
      }
    },
    [onMeasurementComplete, router, photoPreference]
  );

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
        <Text style={styles.message}>
          Camera permission is required for auto-measure
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Success Screen (for >95% confidence)
  if (showSuccessScreen && currentMeasurement) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Measurement Complete!</Text>
        <Text style={styles.successSubtitle}>
          L: {currentMeasurement.dimensions.length.toFixed(1)}cm × W:{" "}
          {currentMeasurement.dimensions.width.toFixed(1)}cm × H:{" "}
          {currentMeasurement.dimensions.height.toFixed(1)}cm
        </Text>
        <Text style={styles.successConfidence}>
          Confidence: {(currentMeasurement.confidence * 100).toFixed(0)}%
        </Text>
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.successAdjustButton}
            onPress={() => {
              setShowSuccessScreen(false);
              setShowAdjustment(true);
              setAdjustableDimensions({ ...currentMeasurement.dimensions });
            }}
          >
            <Text style={styles.successAdjustText}>Quick Adjust</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successDoneButton}
            onPress={() => {
              handleUseMeasurement(
                currentMeasurement,
                capturedPhotosRef.current
              );
            }}
          >
            <Text style={styles.successDoneText}>Looks Good!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Manual Adjustment Screen
  if (showAdjustment && adjustableDimensions) {
    const previousMeasurementForComparison =
      measurementHistory.length > 0
        ? measurementHistory[measurementHistory.length - 1]
        : null;
    const showComparison =
      previousMeasurementForComparison !== null && currentMeasurement !== null;

    return (
      <View style={styles.adjustmentContainer}>
        <Text style={styles.adjustmentTitle}>Adjust Measurements</Text>
        <Text style={styles.adjustmentSubtitle}>
          Fine-tune the dimensions if needed
        </Text>

        {/* Retry comparison */}
        {showComparison &&
          previousMeasurementForComparison &&
          currentMeasurement && (
            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonTitle}>
                Previous vs New Measurement
              </Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonLabel}>Previous</Text>
                  <Text style={styles.comparisonValue}>
                    L:{" "}
                    {previousMeasurementForComparison.dimensions.length.toFixed(
                      1
                    )}
                    cm
                  </Text>
                  <Text style={styles.comparisonValue}>
                    W:{" "}
                    {previousMeasurementForComparison.dimensions.width.toFixed(
                      1
                    )}
                    cm
                  </Text>
                  <Text style={styles.comparisonValue}>
                    H:{" "}
                    {previousMeasurementForComparison.dimensions.height.toFixed(
                      1
                    )}
                    cm
                  </Text>
                  <Text style={styles.comparisonConfidence}>
                    {(
                      previousMeasurementForComparison.confidence * 100
                    ).toFixed(0)}
                    % confidence
                  </Text>
                </View>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonLabel}>New</Text>
                  <Text style={styles.comparisonValue}>
                    L: {currentMeasurement.dimensions.length.toFixed(1)}cm
                  </Text>
                  <Text style={styles.comparisonValue}>
                    W: {currentMeasurement.dimensions.width.toFixed(1)}cm
                  </Text>
                  <Text style={styles.comparisonValue}>
                    H: {currentMeasurement.dimensions.height.toFixed(1)}cm
                  </Text>
                  <Text style={styles.comparisonConfidence}>
                    {(currentMeasurement.confidence * 100).toFixed(0)}%
                    confidence
                  </Text>
                </View>
              </View>
              {/* Highlight differences */}
              {(() => {
                const lengthDiff = Math.abs(
                  currentMeasurement.dimensions.length -
                    previousMeasurementForComparison.dimensions.length
                );
                const widthDiff = Math.abs(
                  currentMeasurement.dimensions.width -
                    previousMeasurementForComparison.dimensions.width
                );
                const heightDiff = Math.abs(
                  currentMeasurement.dimensions.height -
                    previousMeasurementForComparison.dimensions.height
                );
                const maxDiff = Math.max(lengthDiff, widthDiff, heightDiff);

                if (maxDiff > 2) {
                  return (
                    <Text style={styles.comparisonNote}>
                      ⚠️ Significant difference detected ({maxDiff.toFixed(1)}
                      cm)
                    </Text>
                  );
                }
                return (
                  <Text style={styles.comparisonNote}>
                    ✓ Measurements are similar
                  </Text>
                );
              })()}
            </View>
          )}

        {(["length", "width", "height"] as const).map((dim) => (
          <View key={dim} style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>
              {dim.charAt(0).toUpperCase() + dim.slice(1)} (cm)
            </Text>
            <View style={styles.adjustmentControls}>
              <TouchableOpacity
                style={styles.adjustmentButton}
                onPress={() => {
                  setAdjustableDimensions({
                    ...adjustableDimensions,
                    [dim]: Math.max(1, adjustableDimensions[dim] - 0.5),
                  });
                }}
              >
                <Text style={styles.adjustmentButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.adjustmentValue}>
                {adjustableDimensions[dim].toFixed(1)}
              </Text>
              <TouchableOpacity
                style={styles.adjustmentButton}
                onPress={() => {
                  setAdjustableDimensions({
                    ...adjustableDimensions,
                    [dim]: Math.min(200, adjustableDimensions[dim] + 0.5),
                  });
                }}
              >
                <Text style={styles.adjustmentButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.adjustmentActions}>
          <TouchableOpacity
            style={styles.adjustmentCancelButton}
            onPress={() => {
              setShowAdjustment(false);
              setAdjustableDimensions(null);
            }}
          >
            <Text style={styles.adjustmentCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adjustmentSaveButton}
            onPress={() => {
              const adjustedResult: MeasurementResult = {
                ...currentMeasurement!,
                dimensions: adjustableDimensions,
              };
              setCurrentMeasurement(adjustedResult);
              setShowAdjustment(false);
              setAdjustableDimensions(null);
              handleUseMeasurement(adjustedResult, capturedPhotosRef.current);
            }}
          >
            <Text style={styles.adjustmentSaveText}>Use Adjusted</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Photo Preview Screen
  if (showPhotoPreview && previewPhotos.length > 0) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Measurement Photos</Text>
        <Text style={styles.previewSubtitle}>
          These photos include the measurement overlay
        </Text>

        <ScrollView style={styles.previewScrollView}>
          <View style={styles.previewGrid}>
            {previewPhotos.map((photo, index) => (
              <View key={index} style={styles.previewItem}>
                <Text style={styles.previewItemLabel}>
                  {photo.photoType === "main"
                    ? "Main View"
                    : photo.photoType === "side"
                      ? "Side View"
                      : "Reference"}
                </Text>
                {photo.uri ? (
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Text style={styles.previewPlaceholderText}>
                      Photo {index + 1}
                    </Text>
                  </View>
                )}
                {photo.dimensions && (
                  <Text style={styles.previewDimensions}>
                    {photo.dimensions.length.toFixed(1)} ×{" "}
                    {photo.dimensions.width.toFixed(1)} ×{" "}
                    {photo.dimensions.height.toFixed(1)} cm
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={styles.previewCancelButton}
            onPress={() => {
              setShowPhotoPreview(false);
              setPreviewPhotos([]);
            }}
          >
            <Text style={styles.previewCancelText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.previewSaveButton}
            onPress={() => {
              handleUseMeasurement(
                currentMeasurement!,
                capturedPhotosRef.current
              );
              setShowPhotoPreview(false);
              setPreviewPhotos([]);
            }}
          >
            <Text style={styles.previewSaveText}>Save to Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ViewShotComponent
      ref={viewShotRef}
      style={styles.container}
      options={{
        format: "jpg",
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
        {/* Grid overlay */}
        {showGrid && !isCapturing && (
          <View style={styles.gridOverlay} pointerEvents="none">
            {/* Horizontal lines */}
            {[1, 2, 3, 4].map((i) => (
              <View
                key={`h-${i}`}
                style={[
                  styles.gridLine,
                  styles.gridLineHorizontal,
                  { top: `${i * 20}%` },
                ]}
              />
            ))}
            {/* Vertical lines */}
            {[1, 2, 3, 4].map((i) => (
              <View
                key={`v-${i}`}
                style={[
                  styles.gridLine,
                  styles.gridLineVertical,
                  { left: `${i * 20}%` },
                ]}
              />
            ))}
            {/* Center marker */}
            <View style={styles.centerMarker}>
              <View style={styles.centerMarkerHorizontal} />
              <View style={styles.centerMarkerVertical} />
            </View>
          </View>
        )}

        {/* Bounding box overlay with labels */}
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
            {/* Dimension labels */}
            <View style={styles.boundingBoxLabelContainer}>
              <View style={styles.boundingBoxLabel}>
                <Text style={styles.boundingBoxLabelText}>
                  L: {Math.round(currentMeasurement.dimensions.length)}cm
                </Text>
                <Text style={styles.boundingBoxLabelText}>
                  W: {Math.round(currentMeasurement.dimensions.width)}cm
                </Text>
                <Text style={styles.boundingBoxLabelText}>
                  H: {Math.round(currentMeasurement.dimensions.height)}cm
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tilt Warning - Dynamic guidance */}
        {showTiltWarning && !isCapturing && (
          <View style={styles.tiltWarningContainer}>
            <View style={styles.tiltWarningBox}>
              <SafeMaterialIcon name="warning" size={20} color="#f59e0b" />
              <Text style={styles.tiltWarningText}>
                {tiltAvailable && tilt
                  ? `Tilt detected: ${Math.abs(tilt.pitch).toFixed(1)}° pitch, ${Math.abs(tilt.roll).toFixed(1)}° roll. Hold phone level for better accuracy.`
                  : getDistanceGuidance()?.hint || "Hold phone level for better accuracy"}
              </Text>
            </View>
          </View>
        )}

        {/* Validation warning */}
        {validationWarning && (
          <View style={styles.validationWarningContainer}>
            <View style={styles.validationWarningBox}>
              <Text style={styles.validationWarningIcon}>⚠️</Text>
              <Text style={styles.validationWarningText}>
                {validationWarning}
              </Text>
              <TouchableOpacity
                style={styles.validationWarningClose}
                onPress={() => setValidationWarning(null)}
              >
                <Text style={styles.validationWarningCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tutorial overlay */}
        {showTutorial && (
          <View style={styles.tutorialOverlay}>
            <View style={styles.tutorialBox}>
              <Text style={styles.tutorialTitle}>
                {tutorialStep === 0 && "📏 Welcome to Auto-Measure!"}
                {tutorialStep === 1 && "🎯 Positioning Tips"}
                {tutorialStep === 2 && "⚡ Auto-Capture"}
                {tutorialStep === 3 && "✅ You're Ready!"}
              </Text>
              <Text style={styles.tutorialText}>
                {tutorialStep === 0 &&
                  "This tool automatically measures items using your camera. Follow these quick tips for best results."}
                {tutorialStep === 1 &&
                  "• Place item on flat surface\n• Hold phone steady 30-50cm above\n• Keep item centered in frame\n• Use reference object for accuracy"}
                {tutorialStep === 2 &&
                  "• Auto-capture triggers when ready\n• Green checkmark = ready to measure\n• 3-second countdown before capture\n• You can always capture manually"}
                {tutorialStep === 3 &&
                  "• Adjust measurements if needed\n• Save photos with measurement overlay\n• Settings available via ⚙️ button\n• Happy measuring!"}
              </Text>
              <View style={styles.tutorialActions}>
                {tutorialStep > 0 && (
                  <TouchableOpacity
                    style={styles.tutorialButton}
                    onPress={() => {
                      triggerHaptic("light");
                      setTutorialStep(tutorialStep - 1);
                    }}
                  >
                    <Text style={styles.tutorialButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                {tutorialStep < 3 ? (
                  <TouchableOpacity
                    style={styles.tutorialButton}
                    onPress={() => {
                      triggerHaptic("light");
                      setTutorialStep(tutorialStep + 1);
                    }}
                  >
                    <Text style={styles.tutorialButtonText}>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.tutorialButton}
                    onPress={() => {
                      triggerHaptic("success");
                      setShowTutorial(false);
                      const storage =
                        typeof window !== "undefined" && window.localStorage
                          ? window.localStorage
                          : null;
                      if (storage) {
                        storage.setItem("auto-measure-tutorial-seen", "true");
                      }
                    }}
                  >
                    <Text style={styles.tutorialButtonText}>Got it!</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Visual Guidance Overlay */}
        {showGuidance &&
          !currentMeasurement &&
          !isCapturing &&
          !showTutorial && (
            <View style={styles.guidanceOverlay}>
              <View style={styles.guidanceBox}>
                <Text style={styles.guidanceTitle}>📏 How to Measure</Text>
                <Text style={styles.guidanceText}>
                  1. Place item on flat surface{"\n"}
                  2. Hold phone steady above item{"\n"}
                  3. Keep item centered in frame{"\n"}
                  4. Tap "Auto-Measure" when ready
                </Text>
                <TouchableOpacity
                  style={styles.guidanceButton}
                  onPress={() => {
                    triggerHaptic("light");
                    setShowGuidance(false);
                  }}
                >
                  <Text style={styles.guidanceButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Measurement Tips Overlay */}
        {showTips && (
          <View style={styles.tipsOverlay}>
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>💡 Measurement Tips</Text>
              <ScrollView style={styles.tipsContent}>
                <Text style={styles.tipsItem}>
                  • Use good lighting for better accuracy
                </Text>
                <Text style={styles.tipsItem}>
                  • Place item on contrasting background
                </Text>
                <Text style={styles.tipsItem}>
                  • Keep phone steady and level
                </Text>
                <Text style={styles.tipsItem}>
                  • Use reference object (credit card/coin) for calibration
                </Text>
                <Text style={styles.tipsItem}>
                  • Measure from 30-50cm distance
                </Text>
                <Text style={styles.tipsItem}>
                  • Ensure item fills 40-70% of frame
                </Text>
                <Text style={styles.tipsItem}>
                  • Wait for green checkmark before capturing
                </Text>
                <Text style={styles.tipsItem}>
                  • Adjust measurements if needed after capture
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.tipsCloseButton}
                onPress={() => {
                  triggerHaptic("light");
                  setShowTips(false);
                }}
              >
                <Text style={styles.tipsCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Positioning hint overlay */}
        {positioningHint && !isCapturing && !showGuidance && (
          <View style={styles.positioningHintContainer}>
            <View
              style={[
                styles.positioningHintBox,
                {
                  backgroundColor: positioningHint.includes("Perfect")
                    ? "rgba(16, 185, 129, 0.9)"
                    : positioningHint.includes("Good")
                      ? "rgba(245, 158, 11, 0.9)"
                      : "rgba(239, 68, 68, 0.9)",
                },
              ]}
            >
              <Text style={styles.positioningHintText}>{positioningHint}</Text>
              {getDistanceGuidance() && (
                <Text style={styles.distanceGuidanceText}>
                  {getDistanceGuidance()?.hint}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Distance Indicator (Guitar Tuner Style) */}
        {estimatedDistance !== null && currentMeasurement && !isCapturing && !showGuidance && (
          <View style={styles.distanceIndicatorContainer}>
            <View style={styles.distanceIndicatorBox}>
              {(() => {
                const guidance = getDistanceGuidance();
                const state = guidance?.state || "good";
                const isPerfect = state === "perfect";
                const isTooFar = state === "too-far";
                const isTooClose = state === "too-close";
                
                return (
                  <>
                    {/* Arrow indicator */}
                    <View style={styles.distanceArrowContainer}>
                      {isTooFar && <SafeMaterialIcon name="arrow-downward" size={24} color="#ef4444" />}
                      {isTooClose && <SafeMaterialIcon name="arrow-upward" size={24} color="#ef4444" />}
                      {isPerfect && <SafeMaterialIcon name="check-circle" size={24} color="#10b981" />}
                      {state === "good" && <SafeMaterialIcon name="remove" size={24} color="#f59e0b" />}
                    </View>
                    
                    {/* Distance value */}
                    <Text style={[
                      styles.distanceValue,
                      isPerfect && styles.distanceValuePerfect,
                      isTooFar && styles.distanceValueTooFar,
                      isTooClose && styles.distanceValueTooClose,
                    ]}>
                      {estimatedDistance}cm
                    </Text>
                    
                    {/* Status text */}
                    <Text style={[
                      styles.distanceStatus,
                      isPerfect && styles.distanceStatusPerfect,
                    ]}>
                      {isPerfect ? "Perfect!" : isTooFar ? "Too far" : isTooClose ? "Too close" : "Good"}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        {/* Ready indicator */}
        {isReady && !isCapturing && !showGuidance && countdown === null && (
          <View style={styles.readyIndicatorContainer}>
            <Animated.View
              style={[
                styles.readyIndicator,
                {
                  transform: [{ scale: readyPulseAnim }],
                },
              ]}
            >
              <Text style={styles.readyIndicatorIcon}>✓</Text>
            </Animated.View>
            <Text style={styles.readyIndicatorText}>Ready to capture</Text>
          </View>
        )}

        {/* Countdown timer */}
        {countdown !== null && countdown > 0 && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Capturing in...</Text>
            <TouchableOpacity
              style={styles.countdownCancelButton}
              onPress={() => {
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
                  countdownIntervalRef.current = null;
                }
                setCountdown(null);
              }}
            >
              <Text style={styles.countdownCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status indicator with confidence */}
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
                L: {Math.round(currentMeasurement.dimensions.length)}cm W:{" "}
                {Math.round(currentMeasurement.dimensions.width)}cm H:{" "}
                {Math.round(currentMeasurement.dimensions.height)}cm
              </Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${currentMeasurement.confidence * 100}%`,
                      backgroundColor:
                        currentMeasurement.confidence > 0.7
                          ? "#10b981"
                          : currentMeasurement.confidence > 0.5
                            ? "#f59e0b"
                            : "#ef4444",
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {(currentMeasurement.confidence * 100).toFixed(0)}%
              </Text>
              {hasReference && (
                <Text style={styles.referenceText}>
                  Reference detected:{" "}
                  {referenceObject?.type === "credit_card"
                    ? "Credit card"
                    : referenceObject?.type === "coin"
                      ? "Coin"
                      : referenceObject?.type === "paper"
                        ? "Paper"
                        : "detected"}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Reference object guide */}
        {showReferenceGuide && (
          <View style={styles.referenceGuide}>
            <Text style={styles.referenceGuideTitle}>
              Reference Object Guide
            </Text>
            <Text style={styles.referenceGuideText}>
              Place a credit card, coin, or sheet of paper next to the item for
              more accurate measurement.
            </Text>
            <View style={styles.referenceOptions}>
              <TouchableOpacity
                style={[
                  styles.referenceOption,
                  useReference && styles.referenceOptionActive,
                ]}
                onPress={() => setUseReference(!useReference)}
              >
                <Text style={styles.referenceOptionText}>
                  {useReference ? "✓ Use Reference" : "Use Reference"}
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

        {/* Settings overlay */}
        {showSettings && (
          <View style={styles.settingsOverlay}>
            <View style={styles.settingsBox}>
              <Text style={styles.settingsTitle}>Settings</Text>

              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Auto-Capture</Text>
                <TouchableOpacity
                  style={[
                    styles.settingsToggle,
                    autoCaptureEnabled && styles.settingsToggleActive,
                  ]}
                  onPress={() => {
                    const newValue = !autoCaptureEnabled;
                    setAutoCaptureEnabled(newValue);
                    saveAutoCaptureEnabled(newValue);
                  }}
                >
                  <Text style={styles.settingsToggleText}>
                    {autoCaptureEnabled ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Save Photos</Text>
                <View style={styles.settingsOptions}>
                  {(["always", "never", "ask"] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.settingsOption,
                        photoPreference === option &&
                          styles.settingsOptionActive,
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setPhotoPreference(option);
                        savePhotoPreference(option);
                      }}
                    >
                      <Text
                        style={[
                          styles.settingsOptionText,
                          photoPreference === option &&
                            styles.settingsOptionTextActive,
                        ]}
                      >
                        {option === "always"
                          ? "Always"
                          : option === "never"
                            ? "Never"
                            : "Ask"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Other Options</Text>
                <TouchableOpacity
                  style={styles.settingsActionButton}
                  onPress={() => {
                    triggerHaptic("light");
                    const storage =
                      typeof window !== "undefined" && window.localStorage
                        ? window.localStorage
                        : null;
                    if (storage) {
                      storage.removeItem("auto-measure-tutorial-seen");
                    }
                    setShowSettings(false);
                    Alert.alert(
                      "Tutorial Reset",
                      "Tutorial will show on next app launch."
                    );
                  }}
                >
                  <Text style={styles.settingsActionText}>Reset Tutorial</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingsActionButton}
                  onPress={() => {
                    triggerHaptic("light");
                    setMeasurementHistory([]);
                    Alert.alert(
                      "History Cleared",
                      "Measurement history has been cleared."
                    );
                  }}
                >
                  <Text style={styles.settingsActionText}>Clear History</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.settingsCloseButton}
                onPress={() => {
                  triggerHaptic("light");
                  setShowSettings(false);
                }}
              >
                <Text style={styles.settingsCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.tipsButton}
            onPress={() => {
              triggerHaptic("light");
              setShowTips(!showTips);
            }}
          >
            <Text style={styles.tipsButtonText}>💡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              triggerHaptic("light");
              setShowSettings(!showSettings);
            }}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridButton, showGrid && styles.gridButtonActive]}
            onPress={() => {
              triggerHaptic("light");
              setShowGrid(!showGrid);
            }}
          >
            <Text style={styles.gridButtonText}>⊞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <SafeMaterialIcon name="flip-camera-ios" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              (isCapturing || isCapturingPhoto) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing || isCapturingPhoto}
          >
            {isCapturing || isCapturingPhoto ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.captureButtonText}>
                {autoCaptureEnabled ? "Capture Now" : "Auto-Measure"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              try {
                router.back();
              } catch (error) {
                console.warn("[AutoMeasureCamera] Navigation error:", error);
              }
            }}
          >
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
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 4,
    borderColor: "#14b8a6",
    borderStyle: "solid",
    opacity: 0.9,
  },
  boundingBoxBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  boundingBoxLabelContainer: {
    position: "absolute",
    top: -35,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  boundingBoxLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
  },
  boundingBoxLabelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statusBox: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  flipButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  flipButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  captureButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#14b8a6",
    borderRadius: 30,
    minWidth: 150,
    alignItems: "center",
  },
  captureButtonDisabled: {
    backgroundColor: "#666",
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  referenceText: {
    color: "#14b8a6",
    fontSize: 12,
    marginTop: 4,
  },
  referenceGuide: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  referenceGuideTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  referenceGuideText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  referenceOptions: {
    flexDirection: "row",
    gap: 8,
  },
  referenceOption: {
    flex: 1,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    alignItems: "center",
  },
  referenceOptionActive: {
    backgroundColor: "#14b8a6",
  },
  referenceOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  referenceButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  referenceButtonActive: {
    backgroundColor: "#14b8a6",
  },
  referenceButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  // Guidance overlay styles
  guidanceOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  guidanceBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    margin: 20,
    maxWidth: 350,
  },
  guidanceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  guidanceText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  guidanceButton: {
    backgroundColor: "#14b8a6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  guidanceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Confidence bar styles
  confidenceBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 2,
  },
  confidenceText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  // Adjustment screen styles
  adjustmentContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  adjustmentTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  adjustmentSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  adjustmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  adjustmentLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  adjustmentControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  adjustmentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#14b8a6",
    justifyContent: "center",
    alignItems: "center",
  },
  adjustmentButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  adjustmentValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    minWidth: 60,
    textAlign: "center",
  },
  adjustmentActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  adjustmentCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  adjustmentCancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  adjustmentSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  adjustmentSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Photo preview styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  previewSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  previewScrollView: {
    flex: 1,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  previewItem: {
    width: "100%",
    marginBottom: 16,
  },
  previewItemLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  previewPlaceholder: {
    aspectRatio: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#14b8a6",
    borderStyle: "dashed",
  },
  previewPlaceholderText: {
    color: "#666",
    fontSize: 14,
  },
  previewDimensions: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  previewCancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  previewSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  previewSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 20,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  successConfidence: {
    fontSize: 16,
    color: "#10b981",
    marginBottom: 32,
    fontWeight: "600",
  },
  successActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  successAdjustButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  successAdjustText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  successDoneButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  successDoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Positioning hint styles
  positioningHintContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  positioningHintBox: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  positioningHintText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  distanceGuidanceText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  // Distance indicator (guitar tuner style)
  distanceIndicatorContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  distanceIndicatorBox: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 120,
  },
  distanceArrowContainer: {
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  distanceValuePerfect: {
    color: "#10b981",
  },
  distanceValueTooFar: {
    color: "#ef4444",
  },
  distanceValueTooClose: {
    color: "#ef4444",
  },
  distanceStatus: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
  },
  distanceStatusPerfect: {
    color: "#10b981",
    opacity: 1,
    fontWeight: "600",
  },
  // Tilt warning
  tiltWarningContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  tiltWarningBox: {
    backgroundColor: "rgba(245, 158, 11, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tiltWarningText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Angle indicator
  angleIndicatorContainer: {
    position: "absolute",
    top: 200,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  angleIndicatorBox: {
    backgroundColor: "rgba(20, 184, 166, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  angleIndicatorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  // Ready indicator styles
  readyIndicatorContainer: {
    position: "absolute",
    top: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  readyIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  readyIndicatorIcon: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  readyIndicatorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  // Countdown styles
  countdownContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 200,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "bold",
    color: "#14b8a6",
    marginBottom: 16,
  },
  countdownLabel: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 24,
  },
  countdownCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  countdownCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Settings styles
  settingsButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 20,
  },
  settingsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 300,
  },
  settingsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  settingsRow: {
    marginBottom: 24,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  settingsToggle: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignSelf: "flex-start",
  },
  settingsToggleActive: {
    backgroundColor: "#14b8a6",
  },
  settingsToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  settingsOptions: {
    flexDirection: "row",
    gap: 8,
  },
  settingsOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  settingsOptionActive: {
    backgroundColor: "#14b8a6",
  },
  settingsOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  settingsOptionTextActive: {
    color: "#fff",
  },
  settingsCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  settingsCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsActionButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  settingsActionText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  // Comparison styles
  comparisonContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  comparisonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  comparisonColumn: {
    flex: 1,
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  comparisonConfidence: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  comparisonNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  // Grid overlay styles
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  gridLineHorizontal: {
    width: "100%",
    height: 1,
  },
  gridLineVertical: {
    width: 1,
    height: "100%",
  },
  centerMarker: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  centerMarkerHorizontal: {
    position: "absolute",
    width: 40,
    height: 2,
    backgroundColor: "rgba(20, 184, 166, 0.8)",
  },
  centerMarkerVertical: {
    position: "absolute",
    width: 2,
    height: 40,
    backgroundColor: "rgba(20, 184, 166, 0.8)",
  },
  // Validation warning styles
  validationWarningContainer: {
    position: "absolute",
    top: 200,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 200,
  },
  validationWarningBox: {
    backgroundColor: "rgba(245, 158, 11, 0.95)",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "90%",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  validationWarningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  validationWarningText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  validationWarningClose: {
    padding: 4,
    marginLeft: 8,
  },
  validationWarningCloseText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  // Tutorial styles
  tutorialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  tutorialBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    minHeight: 300,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  tutorialText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  tutorialActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  tutorialButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  tutorialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Tips overlay styles
  tipsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 300,
  },
  tipsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    maxHeight: "80%",
  },
  tipsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  tipsContent: {
    maxHeight: 400,
    marginBottom: 16,
  },
  tipsItem: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 12,
    paddingLeft: 8,
  },
  tipsCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  tipsCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Tips button styles
  tipsButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  tipsButtonText: {
    fontSize: 20,
  },
  // Grid button styles
  gridButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  gridButtonActive: {
    backgroundColor: "rgba(20, 184, 166, 0.8)",
  },
  gridButtonText: {
    fontSize: 20,
    color: "#fff",
  },
});
