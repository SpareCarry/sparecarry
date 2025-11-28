/**
 * Dev Mode Banner - Shows when dev mode is enabled
 * Visible on all pages to remind developers to disable before production
 */

"use client";

import { isDevMode } from "@/config/devMode";

export function DevModeBanner() {
  if (!isDevMode()) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 border-b-2 border-yellow-600 px-4 py-2 text-center">
      <p className="text-sm font-bold text-yellow-900">
        🔧 DEV MODE ENABLED - Authentication Skipped
        <span className="ml-2 text-xs">
          (Set NEXT_PUBLIC_DEV_MODE=false before production!)
        </span>
      </p>
    </div>
  );
}

