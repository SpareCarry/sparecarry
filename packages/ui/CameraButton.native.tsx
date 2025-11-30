/**
 * CameraButton - Native (iOS/Android) implementation
 * Uses expo-camera for native platforms
 */

import React from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useCamera } from "@sparecarry/hooks";
import type { CameraButtonProps } from "./CameraButton.types";

export function CameraButton({
  onCapture,
  children,
  style,
}: CameraButtonProps) {
  const { takePicture, pickImage, loading } = useCamera();

  const handleTakePicture = async () => {
    const result = await takePicture();
    if (result) {
      onCapture(result);
    }
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      onCapture(result);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity onPress={handleTakePicture} disabled={loading}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text>{children || "Take Photo"}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handlePickImage} disabled={loading}>
        <Text>Pick from Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}
