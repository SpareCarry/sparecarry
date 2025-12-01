/**
 * ReferencePhotoScreen - Photo-based measurement using reference object
 * Low confidence fallback for non-AR devices
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { TraceInterface } from "../../components/photo/TraceInterface";
import { ARMeasurementResult, REFERENCE_OBJECTS } from "../../lib/types/measurement";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";

export default function ReferencePhotoScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<"camera" | "trace" | "height" | "review">("camera");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [referenceType, setReferenceType] = useState<"US Letter" | "A4">("US Letter");
  const [measurements, setMeasurements] = useState<{
    length: number;
    width: number;
    height: number;
  } | null>(null);
  const [estimatedHeight, setEstimatedHeight] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Request camera permission
  React.useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        setStep("trace");
      }
    } catch (error) {
      console.error("[ReferencePhotoScreen] Capture error:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleTraceComplete = (traceMeasurements: {
    length: number;
    width: number;
    height: number;
  }) => {
    setMeasurements(traceMeasurements);
    setStep("height");
  };

  const handleHeightSubmit = () => {
    const height = parseFloat(estimatedHeight);
    if (isNaN(height) || height <= 0) {
      Alert.alert("Invalid Height", "Please enter a valid height in cm.");
      return;
    }

    if (!measurements || !capturedPhoto) {
      Alert.alert("Error", "Missing measurements or photo.");
      return;
    }

    const finalMeasurements = {
      ...measurements,
      height,
    };

    // Calculate volume in m³
    const volumeM3 = (finalMeasurements.length * finalMeasurements.width * finalMeasurements.height) / 1000000;

    // Create result
    const result: ARMeasurementResult = {
      L: finalMeasurements.length, // cm
      W: finalMeasurements.width, // cm
      H: finalMeasurements.height, // cm
      volume: volumeM3,
      photoUri: capturedPhoto,
      confidence: "Low",
    };

    // Show confirmation modal
    Alert.alert(
      "Measurement Complete",
      `Volume: ${volumeM3.toFixed(4)} m³ (Low Confidence)\n\nLength: ${finalMeasurements.length.toFixed(1)} cm\nWidth: ${finalMeasurements.width.toFixed(1)} cm\nHeight: ${finalMeasurements.height.toFixed(1)} cm\n\nUpload and return?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Use This",
          onPress: () => {
            // Store result in AsyncStorage
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            AsyncStorage.setItem("arMeasurementResult", JSON.stringify(result));
            router.back();
          },
        },
      ]
    );
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Camera view
  if (step === "camera") {
    return (
      <SafeAreaView style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>Reference Photo Method</Text>
              <Text style={styles.instructionText}>
                Place a {referenceType} sheet of paper next to the item
              </Text>
              <View style={styles.referenceButtons}>
                <TouchableOpacity
                  style={[
                    styles.referenceButton,
                    referenceType === "US Letter" && styles.referenceButtonActive,
                  ]}
                  onPress={() => setReferenceType("US Letter")}
                >
                  <Text
                    style={[
                      styles.referenceButtonText,
                      referenceType === "US Letter" && styles.referenceButtonTextActive,
                    ]}
                  >
                    US Letter
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.referenceButton,
                    referenceType === "A4" && styles.referenceButtonActive,
                  ]}
                  onPress={() => setReferenceType("A4")}
                >
                  <Text
                    style={[
                      styles.referenceButtonText,
                      referenceType === "A4" && styles.referenceButtonTextActive,
                    ]}
                  >
                    A4
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.instructionHint}>
                {referenceType === "US Letter"
                  ? "US Letter: 21.59cm × 27.94cm"
                  : "A4: 21.0cm × 29.7cm"}
              </Text>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.captureButtonText}>Capture</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // Trace interface
  if (step === "trace" && capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Trace Dimensions</Text>
            <Text style={styles.subtitle}>
              Trace the reference paper first, then trace the object's dimensions
            </Text>
          </View>

          <TraceInterface
            imageUri={capturedPhoto}
            referenceObject={REFERENCE_OBJECTS[referenceType]}
            onMeasurementComplete={handleTraceComplete}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Height input
  if (step === "height") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter Height/Depth</Text>
            <Text style={styles.subtitle}>
              Enter the estimated height or depth of the item in centimeters
            </Text>
          </View>

          <View style={styles.measurementPreview}>
            <Text style={styles.measurementLabel}>Length: {measurements?.length.toFixed(1)} cm</Text>
            <Text style={styles.measurementLabel}>Width: {measurements?.width.toFixed(1)} cm</Text>
            <Text style={styles.measurementLabel}>Height: ? cm</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Height/Depth (cm)</Text>
            <TextInput
              style={styles.input}
              value={estimatedHeight}
              onChangeText={setEstimatedHeight}
              placeholder="Enter height in cm"
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep("trace")}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleHeightSubmit}
            >
              <Text style={styles.submitButtonText}>Calculate Volume</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  instructionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    borderRadius: 12,
    marginTop: 40,
  },
  instructionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  referenceButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginBottom: 12,
  },
  referenceButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  referenceButtonActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#0d9488",
  },
  referenceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  referenceButtonTextActive: {
    color: "#fff",
  },
  instructionHint: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
  },
  captureButton: {
    backgroundColor: "#14b8a6",
    paddingVertical: 16,
    paddingHorizontal: 32,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
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
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  measurementPreview: {
    backgroundColor: "#f0fdfa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  measurementLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  backButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

