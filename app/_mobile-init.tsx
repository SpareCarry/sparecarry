/**
 * Mobile initialization component
 * Sets up deep linking and other mobile-specific features
 * Import this in your root layout or app entry point
 */

"use client";

import { useEffect } from "react";
import { setupDeepLinking } from "../lib/mobile/deep-linking";

export function MobileInit() {
  useEffect(() => {
    // Setup deep linking when component mounts (mobile only)
    setupDeepLinking().catch((error: any) => {
      console.error("Error setting up deep linking:", error);
    });
  }, []);

  // This component doesn't render anything
  return null;
}

