/**
 * Hook for fetching and sending post/job messages
 * Uses Supabase Realtime for real-time updates via RealtimeManager
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { trackMessageSent } from '../../lib/analytics/tracking';
import { useRealtimeInvalidation } from '../realtime/useRealtime';

export interface PostMessage {
  id: string;
  post_id: string;
  post_type: 'trip' | 'request';
  sender_id: string;
  receiver_id: string;
  content: string;
  read_status: boolean;
  created_at: string;
}

interface UsePostMessagesOptions {
  postId: string;
  postType: 'trip' | 'request';
  currentUserId: string;
  otherUserId: string;
  enabled?: boolean;
}

export function usePostMessages({
  postId,
  postType,
  currentUserId,
  otherUserId,
  enabled = true,
}: UsePostMessagesOptions) {
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading, error } = useQuery<PostMessage[]>({
    queryKey: ['post-messages', postId, postType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_messages')
        .select('*')
        .eq('post_id', postId)
        .eq('post_type', postType)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as PostMessage[];
    },
    enabled: enabled && !!postId && !!postType,
    refetchInterval: false, // Use Realtime instead of polling
  });

  // Set up Realtime subscription using RealtimeManager
  // Custom channel name ensures deduplication if MessageThread + MessageInput both use this hook
  useRealtimeInvalidation(
    'post_messages',
    ['post-messages', postId, postType],
    {
      filter: postId ? `post_id=eq.${postId}` : undefined,
      enabled: enabled && !!postId && !!postType,
      customChannelName: postId && postType ? `post-messages:${postId}:${postType}` : undefined,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('post_messages')
        .insert({
          post_id: postId,
          post_type: postType,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: content.trim(),
          read_status: false,
        })
        .select()
        .single();

      if (error) throw error;
      const message = data as PostMessage;

      // Track analytics
      trackMessageSent(postType, `${postId}-${postType}`);

      // Send push notification
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await fetch('/api/notifications/post-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: message.id,
            receiverId: otherUserId,
            postId,
            postType,
            senderName: user?.email?.split('@')[0] || 'Someone',
            messagePreview: content.trim().substring(0, 50),
          }),
        });
      } catch (notifError) {
        console.error('Error sending message notification:', notifError);
        // Don't fail the message send if notification fails
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-messages', postId, postType] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages', otherUserId] });
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from('post_messages')
        .update({ read_status: true })
        .in('id', messageIds)
        .eq('receiver_id', currentUserId)
        .eq('read_status', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-messages', postId, postType] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages', currentUserId] });
    },
  });

  // Mark all messages in thread as read
  const markThreadAsRead = () => {
    const unreadMessages = messages.filter(
      (msg) => msg.receiver_id === currentUserId && !msg.read_status
    );
    if (unreadMessages.length > 0) {
      markAsReadMutation.mutate(unreadMessages.map((msg) => msg.id));
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    markThreadAsRead,
  };
}

