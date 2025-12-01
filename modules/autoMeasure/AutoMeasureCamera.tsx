/**
 * AutoMeasureCamera - Simplified camera screen for quick measurements
 * 
 * Simple workflow:
 * 1. User manually adjusts bounding box (pinch to scale, drag to position)
 * 2. Tap capture → Calculate dimensions from box size
 * 3. Show dimensions with inline +/- adjust buttons
 * 4. Optional multi-angle capture
 * 5. Save photo (optional) and return to form
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions as ScreenDimensions,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ManualBoundingBox } from "./ManualBoundingBox";
import { calculateDimensionsFromBox, getDistanceHint } from "./calculateDimensions";
import { useTiltDetection } from "./useTiltDetection";
import { useAutoMeasurePhoto } from "./useAutoMeasurePhoto";
import {
  MeasurementResult,
  CapturedPhoto,
  BoundingBox,
  Dimensions,
} from "./types";
import {
  loadPhotoPreference,
  savePhotoPreference,
} from "../../lib/utils/storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = ScreenDimensions.get("window");

// Conditional imports
let ViewShot: any = null;
let Haptics: any = null;
if (typeof require !== "undefined") {
  try {
    Haptics = require("expo-haptics");
  } catch (e) {
    // expo-haptics not available
  }
  try {
    ViewShot = require("react-native-view-shot");
  } catch (e) {
    // react-native-view-shot not available
  }
}

const ViewShotComponent = ViewShot?.default || View;

// Safe MaterialIcon wrapper
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
    const fallbackSymbols: Record<string, string> = {
      warning: "⚠",
      "flip-camera-ios": "🔄",
    };
    return (
      <Text style={{ fontSize: size, color, textAlign: "center" }}>
        {fallbackSymbols[name] || "?"}
      </Text>
    );
  }
};

const triggerHaptic = (type: "light" | "medium" | "success" = "light") => {
  if (!Haptics) return;
  try {
    switch (type) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  } catch (e) {
    // Haptics not available
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
  const [showGrid, setShowGrid] = useState(true);
  const [boundingBox, setBoundingBox] = useState<BoundingBox>({
    x: SCREEN_WIDTH * 0.3,
    y: SCREEN_HEIGHT * 0.3,
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_HEIGHT * 0.4,
  });
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustableDimensions, setAdjustableDimensions] = useState<Dimensions | null>(null);
  const [captureAngle, setCaptureAngle] = useState<1 | 2 | 3 | null>(null);
  const [waitingForNextAngle, setWaitingForNextAngle] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [photoPreference, setPhotoPreference] = useState<"always" | "never" | "ask">("ask");
  
  const cameraRef = useRef<CameraView>(null);
  const viewShotRef = useRef<any>(null);
  
  // Tilt detection (keep for warnings)
  const { tilt, isAvailable: tiltAvailable } = useTiltDetection({ enabled: true });
  const [showTiltWarning, setShowTiltWarning] = useState(false);
  
  // Photo capture
  const { captureView, isCapturing: isCapturingPhoto } = useAutoMeasurePhoto({
    onPhotoCaptured: (photo) => {
      console.log("[AutoMeasureCamera] Photo captured:", photo);
    },
    onError: (error) => {
      console.error("[AutoMeasureCamera] Photo capture error:", error);
    },
  });

  // Load photo preference
  useEffect(() => {
    loadPhotoPreference().then(setPhotoPreference);
  }, []);

  // Check tilt and show warning
  useEffect(() => {
    if (tiltAvailable && tilt) {
      const { pitch, roll } = tilt;
      const tiltAngle = Math.sqrt(pitch * pitch + roll * roll);
      setShowTiltWarning(tiltAngle > 0.26); // ~15 degrees
    } else {
      setShowTiltWarning(false);
    }
  }, [tilt, tiltAvailable]);

  // Calculate dimensions from bounding box
  const calculateMeasurement = useCallback((box: BoundingBox): MeasurementResult => {
    const dimensions = calculateDimensionsFromBox(box);
    return {
      dimensions,
      confidence: 0.7, // Rough estimate confidence
      boundingBox: box,
    };
  }, []);

  // Handle capture
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      triggerHaptic("medium");
      setIsCapturing(true);

      // Calculate measurement from current bounding box
      const measurement = calculateMeasurement(boundingBox);
      setCurrentMeasurement(measurement);
      setAdjustableDimensions({ ...measurement.dimensions });

      // Capture photo with overlay
      let capturedPhoto: CapturedPhoto | null = null;
      if (viewShotRef.current && ViewShot) {
        try {
          const photo = await captureView(viewShotRef.current, measurement);
          if (photo) {
            capturedPhoto = {
              ...photo,
              photoType: captureAngle === 1 ? "main" : captureAngle === 2 ? "side" : "reference",
            };
          }
        } catch (error) {
          console.warn("[AutoMeasureCamera] Photo capture failed:", error);
        }
      }

      if (capturedPhoto) {
        setCapturedPhotos((prev) => [...prev, capturedPhoto!]);
      }

      // If first capture, ask about multi-angle
      if (captureAngle === null) {
        setCaptureAngle(1);
        setWaitingForNextAngle(true);
        triggerHaptic("success");
      } else if (captureAngle === 1) {
        // After first, ask for side view
        setCaptureAngle(2);
        setWaitingForNextAngle(true);
      } else if (captureAngle === 2) {
        // After second, ask for third
        setCaptureAngle(3);
        setWaitingForNextAngle(true);
      } else {
        // All done
        setShowAdjustment(true);
      }

      setIsCapturing(false);
    } catch (error) {
      console.error("[AutoMeasureCamera] Capture error:", error);
      triggerHaptic("error");
      setIsCapturing(false);
    }
  }, [boundingBox, isCapturing, captureAngle, calculateMeasurement, captureView]);

  // Handle using measurement
  const handleUseMeasurement = useCallback(async () => {
    if (!currentMeasurement || !adjustableDimensions) return;

    try {
      const roundedResult: MeasurementResult = {
        ...currentMeasurement,
        dimensions: {
          length: Math.round(adjustableDimensions.length),
          width: Math.round(adjustableDimensions.width),
          height: Math.round(adjustableDimensions.height),
        },
      };

      const navigateBack = () => {
        try {
          router.back();
        } catch (error) {
          console.warn("[AutoMeasureCamera] Navigation error:", error);
        }
      };

      // Handle photo saving
      if (capturedPhotos.length > 0 && photoPreference === "ask") {
        Alert.alert(
          "Save Photos?",
          "Save measurement photos with overlay?",
          [
            {
              text: "Skip",
              style: "cancel",
              onPress: () => {
                onMeasurementComplete?.(roundedResult, undefined);
                navigateBack();
              },
            },
            {
              text: "Save",
              onPress: () => {
                onMeasurementComplete?.(roundedResult, capturedPhotos);
                navigateBack();
              },
            },
          ]
        );
      } else if (capturedPhotos.length > 0 && photoPreference === "always") {
        onMeasurementComplete?.(roundedResult, capturedPhotos);
        navigateBack();
      } else {
        onMeasurementComplete?.(roundedResult, undefined);
        navigateBack();
      }
    } catch (error) {
      console.error("[AutoMeasureCamera] Error:", error);
      try {
        router.back();
      } catch (navError) {
        console.error("[AutoMeasureCamera] Navigation error:", navError);
      }
    }
  }, [currentMeasurement, adjustableDimensions, capturedPhotos, photoPreference, onMeasurementComplete, router]);

  // Skip multi-angle
  const handleSkipAngle = useCallback(() => {
    setWaitingForNextAngle(false);
    setShowAdjustment(true);
  }, []);

  // Add another angle
  const handleAddAngle = useCallback(() => {
    setWaitingForNextAngle(false);
    // User can capture again - the capture button will work
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
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Adjustment screen (inline)
  if (showAdjustment && adjustableDimensions) {
    const distanceHint = getDistanceHint(boundingBox);
    
    return (
      <View style={styles.adjustmentContainer}>
        <Text style={styles.adjustmentTitle}>Dimensions</Text>
        {distanceHint && (
          <Text style={styles.distanceHint}>{distanceHint.hint}</Text>
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
            onPress={handleUseMeasurement}
          >
            <Text style={styles.adjustmentSaveText}>Use These</Text>
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
        paused={isCapturing}
      >
        {/* Grid overlay */}
        {showGrid && (
          <View style={styles.gridOverlay} pointerEvents="none">
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
          </View>
        )}

        {/* Manual bounding box */}
        <ManualBoundingBox
          onBoxChange={setBoundingBox}
          initialBox={boundingBox}
        />

        {/* Dimensions label on box */}
        {currentMeasurement && (
          <View
            style={[
              styles.dimensionsLabel,
              {
                left: boundingBox.x,
                top: boundingBox.y - 35,
              },
            ]}
          >
            <Text style={styles.dimensionsLabelText}>
              L: {Math.round(currentMeasurement.dimensions.length)}cm ×{" "}
              W: {Math.round(currentMeasurement.dimensions.width)}cm ×{" "}
              H: {Math.round(currentMeasurement.dimensions.height)}cm
            </Text>
          </View>
        )}

        {/* Tilt warning (subtle) */}
        {showTiltWarning && (
          <View style={styles.tiltWarningContainer}>
            <View style={styles.tiltWarningBox}>
              <SafeMaterialIcon name="warning" size={16} color="#f59e0b" />
              <Text style={styles.tiltWarningText}>
                Hold phone level for better accuracy
              </Text>
            </View>
          </View>
        )}

        {/* Distance hint (subtle) */}
        {!currentMeasurement && (() => {
          const hint = getDistanceHint(boundingBox);
          if (hint && hint.state !== "perfect") {
            return (
              <View style={styles.distanceHintContainer}>
                <Text style={styles.distanceHintText}>{hint.hint}</Text>
              </View>
            );
          }
          return null;
        })()}

        {/* Multi-angle prompt */}
        {waitingForNextAngle && (
          <View style={styles.anglePromptContainer}>
            <View style={styles.anglePromptBox}>
              <Text style={styles.anglePromptText}>
                {captureAngle === 1
                  ? "Add side view for better accuracy?"
                  : captureAngle === 2
                    ? "Add another angle?"
                    : "All angles captured"}
              </Text>
              <View style={styles.anglePromptActions}>
                <TouchableOpacity
                  style={styles.anglePromptButton}
                  onPress={handleSkipAngle}
                >
                  <Text style={styles.anglePromptButtonText}>Skip</Text>
                </TouchableOpacity>
                {captureAngle !== 3 && (
                  <TouchableOpacity
                    style={[styles.anglePromptButton, styles.anglePromptButtonPrimary]}
                    onPress={handleAddAngle}
                  >
                    <Text style={[styles.anglePromptButtonText, styles.anglePromptButtonTextPrimary]}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
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
            onPress={() => {
              triggerHaptic("light");
              setFacing((current) => (current === "back" ? "front" : "back"));
            }}
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
              <Text style={styles.captureButtonText}>Capture</Text>
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
  // Grid overlay
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
  // Dimensions label
  dimensionsLabel: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  dimensionsLabelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Tilt warning
  tiltWarningContainer: {
    position: "absolute",
    top: 60,
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
    fontSize: 12,
    fontWeight: "600",
  },
  // Distance hint
  distanceHintContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  distanceHintText: {
    color: "#fff",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  // Multi-angle prompt
  anglePromptContainer: {
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
  anglePromptBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 250,
  },
  anglePromptText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  anglePromptActions: {
    flexDirection: "row",
    gap: 12,
  },
  anglePromptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  anglePromptButtonPrimary: {
    backgroundColor: "#14b8a6",
  },
  anglePromptButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  anglePromptButtonTextPrimary: {
    color: "#fff",
  },
  // Controls
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
  flipButton: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
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
  // Adjustment screen
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
  distanceHint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
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
});

