/**
 * CameraButton - Web implementation
 * Uses file input for web browsers
 */

import React from "react";
import { useCamera } from "@sparecarry/hooks";
import type { CameraButtonProps } from "./CameraButton.types";

export function CameraButton({
  onCapture,
  children,
  className,
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
    <div className={className}>
      <button onClick={handleTakePicture} disabled={loading}>
        {children || "Take Photo"}
      </button>
      <button onClick={handlePickImage} disabled={loading}>
        Pick from Gallery
      </button>
    </div>
  );
}
