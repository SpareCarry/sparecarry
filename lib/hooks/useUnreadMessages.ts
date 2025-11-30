/**
 * Hook for fetching unread message count
 * Uses Supabase Realtime for real-time updates via RealtimeManager
 */

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/client";
import { useRealtimeInvalidation } from "../realtime/useRealtime";

export function useUnreadMessages(userId: string | undefined) {
  // Memoize supabase client to prevent creating new instances on every render
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data: unreadCount = 0, isLoading } = useQuery<number>({
    queryKey: ["unread-messages", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("post_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("read_status", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: false, // Use Realtime instead of polling
  });

  // Set up Realtime subscription for unread count using RealtimeManager
  // Custom channel name ensures deduplication across multiple MessageBadge instances
  useRealtimeInvalidation("post_messages", ["unread-messages", userId], {
    filter: userId ? `receiver_id=eq.${userId}` : undefined,
    enabled: !!userId,
    customChannelName: userId ? `unread-messages:${userId}` : undefined,
  });

  return {
    unreadCount,
    isLoading,
  };
}
