/**
 * CameraButton - Universal component with memoization
 * Automatically uses .web.tsx or .native.tsx based on platform
 */

import { memo } from "react";
import type { ReactElement } from "react";
import { isWeb } from "@sparecarry/lib/platform";
import type { CameraButtonProps } from "./CameraButton.types";
export type { CameraButtonProps } from "./CameraButton.types";

type CameraButtonComponent = (props: CameraButtonProps) => ReactElement;

let ComponentImpl: CameraButtonComponent;

if (isWeb) {
  const { CameraButton: WebCameraButton } = require("./CameraButton.web") as {
    CameraButton: CameraButtonComponent;
  };
  ComponentImpl = WebCameraButton;
} else {
  const { CameraButton: NativeCameraButton } =
    require("./CameraButton.native") as {
      CameraButton: CameraButtonComponent;
    };
  ComponentImpl = NativeCameraButton;
}

export const CameraButton = memo((props: CameraButtonProps) =>
  ComponentImpl(props)
);
