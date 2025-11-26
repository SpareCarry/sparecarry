/**
 * MessageBadge Component
 * 
 * Displays unread message count badge for sidebar
 */

"use client";

import { useMemo } from 'react';
import { useUnreadMessages } from '../../lib/hooks/useUnreadMessages';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MessageCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';

interface MessageBadgeProps {
  userId: string | undefined;
  className?: string;
}

type PostMessageThread = {
  post_id: string;
  post_type: string;
};

export function MessageBadge({ userId, className }: MessageBadgeProps) {
  const router = useRouter();
  // Use useMemo to create supabase client only once per component instance
  // This prevents creating new clients on every render and infinite loops
  const supabase = useMemo(() => createClient() as SupabaseClient, []);
  const { unreadCount, isLoading } = useUnreadMessages(userId);

  // Fetch threads with unread messages for navigation
  const { data: threads } = useQuery({
    queryKey: ['unread-threads', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('post_messages')
        .select('post_id, post_type')
        .eq('receiver_id', userId)
        .eq('read_status', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Get unique threads
      const messages = (data ?? []) as PostMessageThread[];
      const uniqueThreads = Array.from(
        new Map(messages.map((msg) => [`${msg.post_id}-${msg.post_type}`, msg])).values()
      );

      return uniqueThreads;
    },
    enabled: !!userId && unreadCount > 0,
  });

  if (isLoading || !userId) {
    return null;
  }

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <p className="font-semibold text-sm">Unread Messages ({unreadCount})</p>
          {threads && threads.length > 0 ? (
            <div className="space-y-1">
              {threads.map((thread) => (
                <Button
                  key={`${thread.post_id}-${thread.post_type}`}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    // Navigate to the post detail page
                    // This would need to be implemented based on your routing
                    router.push(`/home?openThread=${thread.post_id}&type=${thread.post_type}`);
                  }}
                >
                  {thread.post_type === 'trip' ? 'Trip' : 'Request'} - {thread.post_id.slice(0, 8)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No unread messages</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

