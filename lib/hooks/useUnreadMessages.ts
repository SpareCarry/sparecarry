/**
 * Hook for fetching unread message count
 * Uses Supabase Realtime for real-time updates
 */

import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useUnreadMessages(userId: string | undefined) {
  // Memoize supabase client to prevent creating new instances on every render
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const { data: unreadCount = 0, isLoading } = useQuery<number>({
    queryKey: ['unread-messages', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('post_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read_status', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: false, // Use Realtime instead of polling
  });

  // Set up Realtime subscription for unread count
  useEffect(() => {
    if (!userId) return;

    const newChannel = supabase
      .channel(`unread-messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          // Invalidate and refetch unread count
          queryClient.invalidateQueries({ queryKey: ['unread-messages', userId] });
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      newChannel.unsubscribe();
    };
    // supabase is memoized with useMemo, so it's stable across renders
  }, [userId, queryClient, supabase]);

  return {
    unreadCount,
    isLoading,
  };
}

