import type React from "react";

export interface CameraCaptureResult {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

export interface CameraButtonProps {
  onCapture: (result: CameraCaptureResult) => void;
  children?: React.ReactNode;
  className?: string;
  style?: any;
}
