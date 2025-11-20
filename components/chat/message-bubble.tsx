"use client";

import { format } from "date-fns";
import { cn } from "../../lib/utils";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender?: {
      avatar_url?: string;
    };
  };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2",
          isOwn
            ? "bg-teal-600 text-white"
            : "bg-white border border-slate-200 text-slate-900"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isOwn ? "text-teal-100" : "text-slate-500"
          )}
        >
          {format(new Date(message.created_at), "HH:mm")}
        </p>
      </div>
    </div>
  );
}

