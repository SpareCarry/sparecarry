/**
 * MessageActions Component
 *
 * Edit and delete actions for messages
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface MessageActionsProps {
  messageId: string;
  messageType: "match" | "post";
  content: string;
  createdAt: string;
  onEdit?: (newContent: string) => void;
  className?: string;
}

// Allow editing within 15 minutes
const EDIT_TIME_LIMIT_MS = 15 * 60 * 1000;

export function MessageActions({
  messageId,
  messageType,
  content,
  createdAt,
  onEdit,
  className,
}: MessageActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();

  const messageDate = new Date(createdAt);
  const canEdit = Date.now() - messageDate.getTime() < EDIT_TIME_LIMIT_MS;
  const tableName = messageType === "match" ? "messages" : "post_messages";

  // Update message mutation
  const updateMessageMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const { error } = await supabase
        .from(tableName)
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          messageType === "match" ? ["conversation"] : ["post-messages"],
      });
      setIsEditing(false);
      onEdit?.(editContent);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(tableName)
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          messageType === "match" ? ["conversation"] : ["post-messages"],
      });
    },
  });

  const handleSave = () => {
    if (editContent.trim() && editContent !== content) {
      updateMessageMutation.mutate(editContent.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={className}>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
          autoFocus
        />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMessageMutation.isPending}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateMessageMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            if (confirm("Delete this message?")) {
              deleteMessageMutation.mutate();
            }
          }}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
