"use client";

import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from "date-fns";
import { cn } from "../../lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { MessageReactions } from "../messaging/MessageReactions";
import { MessageActionsSimple } from "../messaging/MessageActionsSimple";
import { SwipeableMessage } from "../messaging/SwipeableMessage";
import { LinkPreviewCard } from "../messaging/LinkPreview";
import { extractUrls, isApprovedUrl } from "../../lib/utils/link-preview";
import Image from "next/image";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read_at?: string | null;
    read_status?: boolean;
    image_urls?: string[] | null;
    audio_url?: string | null;
    edited_at?: string | null;
    deleted_at?: string | null;
    sender?: {
      avatar_url?: string;
    };
  };
  isOwn: boolean;
  messageType?: "match" | "post";
  currentUserId?: string;
}

function formatMessageTime(date: Date): string {
  if (isToday(date)) {
    return format(date, "HH:mm");
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "HH:mm")}`;
  } else if (isThisWeek(date)) {
    return format(date, "EEE HH:mm");
  } else {
    return format(date, "MMM d, HH:mm");
  }
}

export function MessageBubble({
  message,
  isOwn,
  messageType,
  currentUserId,
}: MessageBubbleProps) {
  const messageDate = new Date(message.created_at);
  const isRead = isOwn && (message.read_at || message.read_status);
  const isDeleted = !!message.deleted_at;

  // Show deleted message placeholder
  if (isDeleted) {
    return (
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isOwn ? "ml-auto items-end" : "mr-auto items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2 italic text-slate-400",
            isOwn ? "bg-slate-100" : "border border-slate-200 bg-slate-50"
          )}
        >
          <p className="text-sm">This message was deleted</p>
        </div>
      </div>
    );
  }

  const messageContent = (
    <div
      className={cn(
        "group flex max-w-[80%] flex-col gap-1",
        isOwn ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isOwn
              ? "bg-teal-600 text-white"
              : "border border-slate-200 bg-white text-slate-900"
          )}
        >
          {/* Images */}
          {message.image_urls && message.image_urls.length > 0 && (
            <div
              className={cn(
                "mb-2 grid gap-2",
                message.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {message.image_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full overflow-hidden rounded-lg border border-slate-200"
                >
                  <div
                    className="relative w-full"
                    style={{ maxHeight: "256px", minHeight: "100px" }}
                  >
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 512px"
                      unoptimized={
                        url.startsWith("blob:") || url.startsWith("data:")
                      }
                    />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Audio message */}
          {message.audio_url && (
            <div className="mb-2">
              <audio
                src={message.audio_url}
                controls
                className={cn(
                  "w-full max-w-xs",
                  isOwn ? "audio-teal" : "audio-white"
                )}
                style={{
                  height: "40px",
                }}
              />
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <>
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {/* Link previews for approved URLs */}
              {(() => {
                const urls = extractUrls(message.content);
                const approvedUrls = urls.filter(isApprovedUrl);
                if (approvedUrls.length === 0) return null;

                return (
                  <div className="mt-2 space-y-2">
                    {approvedUrls.map((url, index) => (
                      <LinkPreviewCard key={index} url={url} />
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          <div
            className={cn(
              "mt-1 flex items-center gap-1",
              isOwn
                ? "justify-end text-teal-100"
                : "justify-start text-slate-500"
            )}
          >
            <span className="text-xs">{formatMessageTime(messageDate)}</span>
            {message.edited_at && (
              <span className="text-xs opacity-70">(edited)</span>
            )}
            {isOwn && (
              <span className="ml-1">
                {isRead ? (
                  <CheckCheck className="h-3 w-3 text-teal-200" />
                ) : (
                  <Check className="h-3 w-3 text-teal-200 opacity-50" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Message Actions (Edit/Delete) - Only show for own messages */}
        {isOwn && messageType && currentUserId && (
          <MessageActionsSimple
            messageId={message.id}
            messageType={messageType}
            content={message.content}
            createdAt={message.created_at}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>

      {/* Reactions */}
      {messageType && currentUserId && (
        <MessageReactions
          messageId={message.id}
          messageType={messageType}
          currentUserId={currentUserId}
          className="mt-1"
        />
      )}
    </div>
  );

  // Wrap in SwipeableMessage for mobile (only for received messages)
  if (!isOwn && messageType && currentUserId) {
    return (
      <SwipeableMessage
        onReply={() => {
          // Scroll to input and focus
          const input = document.querySelector(
            'input[placeholder*="message" i]'
          ) as HTMLInputElement;
          if (input) {
            input.focus();
            input.value = `Re: ${message.content.substring(0, 50)}... `;
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}
        canDelete={false} // Can't delete others' messages
      >
        {messageContent}
      </SwipeableMessage>
    );
  }

  return messageContent;
}
