"use client";

import { useOnlineStatus } from "@/lib/utils/offline-detection";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Offline Banner Component
 *
 * Displays a banner when the app goes offline
 */
export function OfflineBanner({ className }: { className?: string }) {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-yellow-900",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span>You are currently offline. Some features may be unavailable.</span>
    </div>
  );
}
