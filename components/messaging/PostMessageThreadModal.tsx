/**
 * PostMessageThreadModal Component
 *
 * Modal for viewing and sending messages in a post/job thread
 */

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";
import { MessageSearch } from "./MessageSearch";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { usePostMessages } from "../../lib/hooks/usePostMessages";

interface PostMessageThreadModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postType: "trip" | "request";
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
    queryKey: ["post-details", postId, postType],
    queryFn: async () => {
      const table = postType === "trip" ? "trips" : "requests";
      const { data, error } = await supabase
        .from(table)
        .select("user_id, from_location, to_location, title")
        .eq("id", postId)
        .single();

      if (error) throw error;
      return (data ?? null) as PostDetails | null;
    },
    enabled: open && !!postId,
  });

  const otherUserId = postData?.user_id;
  const postTitle =
    postData?.title || `${postData?.from_location} → ${postData?.to_location}`;

  // Get messages for search
  const { messages } = usePostMessages({
    postId,
    postType,
    currentUserId,
    otherUserId: otherUserId || "",
    enabled: open && !!otherUserId && otherUserId !== currentUserId,
  });

  if (!otherUserId || otherUserId === currentUserId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col p-0">
        <DialogHeader className="space-y-2 border-b px-4 py-3">
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
          {messages && messages.length > 0 && (
            <MessageSearch
              messages={messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                sender_id: msg.sender_id,
              }))}
              onMessageSelect={(messageId) => {
                // Scroll to message in thread
                const messageElement = document.querySelector(
                  `[data-message-id="${messageId}"]`
                );
                if (messageElement) {
                  messageElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  messageElement.classList.add("ring-2", "ring-teal-500");
                  setTimeout(() => {
                    messageElement.classList.remove("ring-2", "ring-teal-500");
                  }, 2000);
                }
              }}
            />
          )}
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
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
