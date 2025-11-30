/**
 * MessageReactions Component
 *
 * Display and manage emoji reactions on messages
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Smile, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  messageType: "match" | "post";
  currentUserId: string;
  className?: string;
}

const COMMON_EMOJIS = ["👍", "❤️", "✅", "😊", "🎉", "👏", "🔥", "💯"];

export function MessageReactions({
  messageId,
  messageType,
  currentUserId,
  className,
}: MessageReactionsProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();

  const tableName =
    messageType === "match" ? "message_reactions" : "post_message_reactions";
  const messageIdField =
    messageType === "match" ? "message_id" : "post_message_id";

  // Fetch reactions
  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: ["message-reactions", messageId, messageType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("emoji, user_id")
        .eq(messageIdField, messageId);

      if (error) throw error;

      // Group by emoji and count
      const grouped = (data || []).reduce(
        (acc, reaction) => {
          const emoji = reaction.emoji;
          if (!acc[emoji]) {
            acc[emoji] = { emoji, count: 0, userReacted: false };
          }
          acc[emoji].count++;
          if (reaction.user_id === currentUserId) {
            acc[emoji].userReacted = true;
          }
          return acc;
        },
        {} as Record<string, Reaction>
      );

      return Object.values(grouped);
    },
    enabled: !!messageId && !!currentUserId,
  });

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const existingReaction = reactions.find(
        (r) => r.emoji === emoji && r.userReacted
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(messageIdField, messageId)
          .eq("user_id", currentUserId)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase.from(tableName).insert({
          [messageIdField]: messageId,
          user_id: currentUserId,
          emoji,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["message-reactions", messageId, messageType],
      });
    },
  });

  const handleReactionClick = (emoji: string) => {
    toggleReactionMutation.mutate(emoji);
    setEmojiPickerOpen(false);
  };

  if (reactions.length === 0 && !emojiPickerOpen) {
    return (
      <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 px-2 text-xs", className)}
          >
            <Smile className="mr-1 h-3 w-3" />
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="grid grid-cols-4 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReactionClick(emoji)}
                className="rounded p-2 text-2xl transition-colors hover:bg-slate-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant={reaction.userReacted ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-6 px-2 text-xs",
            reaction.userReacted && "border-teal-300 bg-teal-100 text-teal-900"
          )}
          onClick={() => handleReactionClick(reaction.emoji)}
        >
          <span className="mr-1">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}
      <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="grid grid-cols-4 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReactionClick(emoji)}
                className="rounded p-2 text-2xl transition-colors hover:bg-slate-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
