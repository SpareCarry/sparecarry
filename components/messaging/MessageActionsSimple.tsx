/**
 * MessageActionsSimple Component
 *
 * Simple edit and delete actions without dropdown (fallback)
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Edit, Trash2, X, Check } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/utils";

interface MessageActionsSimpleProps {
  messageId: string;
  messageType: "match" | "post";
  content: string;
  createdAt: string;
  onEdit?: (newContent: string) => void;
  className?: string;
}

// Allow editing within 15 minutes
const EDIT_TIME_LIMIT_MS = 15 * 60 * 1000;

export function MessageActionsSimple({
  messageId,
  messageType,
  content,
  createdAt,
  onEdit,
  className,
}: MessageActionsSimpleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showActions, setShowActions] = useState(false);
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
      setShowActions(false);
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
      setShowActions(false);
    },
  });

  const handleSave = () => {
    if (editContent.trim() && editContent !== content) {
      updateMessageMutation.mutate(editContent.trim());
    } else {
      setIsEditing(false);
      setShowActions(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
    setShowActions(false);
  };

  if (isEditing) {
    return (
      <div className={cn("w-full", className)}>
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
            <Check className="mr-1 h-4 w-4" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateMessageMutation.isPending}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!showActions) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowActions(true)}
        className={className}
      >
        ⋯
      </Button>
    );
  }

  return (
    <div className={cn("flex gap-1", className)}>
      {canEdit && (
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (confirm("Delete this message?")) {
            deleteMessageMutation.mutate();
          } else {
            setShowActions(false);
          }
        }}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShowActions(false)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
