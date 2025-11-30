/**
 * Hook for typing indicators
 * Uses Supabase Realtime broadcast channels to show when users are typing
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UseTypingIndicatorOptions {
  conversationId: string; // match_id or post_id+post_type
  conversationType: "match" | "post";
  currentUserId: string;
  otherUserId: string;
  enabled?: boolean;
}

export function useTypingIndicator({
  conversationId,
  conversationType,
  currentUserId,
  otherUserId,
  enabled = true,
}: UseTypingIndicatorOptions) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !conversationId || !otherUserId) return;

    if (!supabaseRef.current) {
      supabaseRef.current = createClient() as SupabaseClient;
    }

    const supabase = supabaseRef.current;
    const channelName = `typing:${conversationType}:${conversationId}`;

    // Subscribe to typing events
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive our own broadcasts
      },
    });

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, isTyping } = payload.payload;
        // Only show typing indicator if it's from the other user
        if (userId === otherUserId) {
          setIsOtherUserTyping(isTyping);

          // Auto-hide after 3 seconds of no typing
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherUserTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [enabled, conversationId, conversationType, otherUserId]);

  // Broadcast typing status
  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !enabled) return;

      const now = Date.now();
      // Throttle: only broadcast every 1 second
      if (isTyping && now - lastTypingTimeRef.current < 1000) {
        return;
      }
      lastTypingTimeRef.current = now;

      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          isTyping,
        },
      });
    },
    [currentUserId, enabled]
  );

  return {
    isOtherUserTyping,
    broadcastTyping,
  };
}
