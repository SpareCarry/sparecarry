/**
 * PostMessageThreadModal Component
 * 
 * Modal for viewing and sending messages in a post/job thread
 */

"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { MessageThread } from './MessageThread';
import { MessageInput } from './MessageInput';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

interface PostMessageThreadModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postType: 'trip' | 'request';
  currentUserId: string;
}

type PostDetails = {
  user_id: string;
  from_location?: string | null;
  to_location?: string | null;
  title?: string | null;
};

export function PostMessageThreadModal({
  open,
  onClose,
  postId,
  postType,
  currentUserId,
}: PostMessageThreadModalProps) {
  const supabase = createClient() as SupabaseClient;
  
  // Fetch post details to get the other user ID
  const { data: postData } = useQuery<PostDetails | null>({
    queryKey: ['post-details', postId, postType],
    queryFn: async () => {
      const table = postType === 'trip' ? 'trips' : 'requests';
      const { data, error } = await supabase
        .from(table)
        .select('user_id, from_location, to_location, title')
        .eq('id', postId)
        .single();

      if (error) throw error;
      return (data ?? null) as PostDetails | null;
    },
    enabled: open && !!postId,
  });

  const otherUserId = postData?.user_id;
  const postTitle = postData?.title || `${postData?.from_location} → ${postData?.to_location}`;

  if (!otherUserId || otherUserId === currentUserId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Messages - {postTitle}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageThread
            postId={postId}
            postType={postType}
            currentUserId={currentUserId}
            otherUserId={otherUserId}
          />
          <MessageInput
            postId={postId}
            postType={postType}
            currentUserId={currentUserId}
            otherUserId={otherUserId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

