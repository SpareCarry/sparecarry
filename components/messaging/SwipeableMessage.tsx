/**
 * SwipeableMessage Component
 *
 * Wraps a message bubble with swipe actions for mobile
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Reply, Trash2 } from "lucide-react";

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 50; // Minimum swipe distance

export function SwipeableMessage({
  children,
  onReply,
  onDelete,
  canDelete = false,
  className,
}: SwipeableMessageProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startXRef.current || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;

    // Only allow swiping left (negative) for actions
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -120)); // Max swipe distance
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      // Trigger action based on swipe distance
      if (swipeOffset < -80 && onDelete && canDelete) {
        onDelete();
      } else if (swipeOffset < -40 && onReply) {
        onReply();
      }
    }

    // Reset position
    setSwipeOffset(0);
    startXRef.current = null;
  };

  // Reset on mouse leave (desktop)
  useEffect(() => {
    if (!isSwiping) {
      const timer = setTimeout(() => setSwipeOffset(0), 300);
      return () => clearTimeout(timer);
    }
  }, [isSwiping]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Action buttons (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
        {onReply && (
          <button
            onClick={onReply}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white transition-opacity",
              Math.abs(swipeOffset) > 40 ? "opacity-100" : "opacity-0"
            )}
            style={{
              transform: `translateX(${Math.max(swipeOffset + 40, 0)}px)`,
            }}
          >
            <Reply className="h-4 w-4" />
          </button>
        )}
        {onDelete && canDelete && (
          <button
            onClick={onDelete}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-opacity",
              Math.abs(swipeOffset) > 80 ? "opacity-100" : "opacity-0"
            )}
            style={{
              transform: `translateX(${Math.max(swipeOffset + 80, 0)}px)`,
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Message content */}
      <div
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
}
