/**
 * MessageThread Component
 * 
 * Displays a scrollable list of messages for a post/job thread
 * Optimized with React.memo and useMemo for performance
 */

"use client";

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { MessageBubble } from '../chat/message-bubble';
import { usePostMessages, PostMessage } from '../../lib/hooks/usePostMessages';
import { Loader2, Languages } from 'lucide-react';
import { translateText, getUserLanguage, isAutoTranslateEnabled } from '../../lib/translation/auto-translate';
import { createClient } from '../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../ui/button';

interface MessageThreadProps {
  postId: string;
  postType: 'trip' | 'request';
  currentUserId: string;
  otherUserId: string;
  onMarkAsRead?: () => void;
}

function MessageThreadComponent({
  postId,
  postType,
  currentUserId,
  otherUserId,
  onMarkAsRead,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const supabase = createClient() as SupabaseClient;
  const { messages, isLoading, markThreadAsRead } = usePostMessages({
    postId,
    postType,
    currentUserId,
    otherUserId,
    enabled: true,
  });

  // Check if auto-translate is enabled
  useEffect(() => {
    async function checkAutoTranslate() {
      const enabled = await isAutoTranslateEnabled(currentUserId);
      setAutoTranslate(enabled);
    }
    checkAutoTranslate();
  }, [currentUserId]);

  // Translate messages when auto-translate is enabled
  useEffect(() => {
    async function translateMessages() {
      if (!autoTranslate || messages.length === 0) {
        return;
      }

      setIsTranslating(true);
      const userLang = getUserLanguage();
      const newTranslations: Record<string, string> = {};

      for (const message of messages) {
        if (message.sender_id !== currentUserId && !translations[message.id]) {
          try {
            const result = await translateText(message.content, userLang);
            if (result.translatedText !== message.content) {
              newTranslations[message.id] = result.translatedText;
            }
          } catch (error) {
            console.error('Translation error:', error);
          }
        }
      }

      if (Object.keys(newTranslations).length > 0) {
        setTranslations(prev => ({ ...prev, ...newTranslations }));
      }
      setIsTranslating(false);
    }

    translateMessages();
  }, [autoTranslate, messages, currentUserId, translations]);

  // Memoize message list to prevent unnecessary re-renders
  const messageList = useMemo(() => {
    return messages.map((message: PostMessage) => ({
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      created_at: message.created_at,
      isOwn: message.sender_id === currentUserId,
    }));
  }, [messages, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]); // Only depend on length, not full array

  // Mark thread as read when component mounts or messages change
  const handleMarkAsRead = useCallback(() => {
    if (messages.length > 0) {
      markThreadAsRead();
      onMarkAsRead?.();
    }
  }, [messages.length, markThreadAsRead, onMarkAsRead]);

  useEffect(() => {
    handleMarkAsRead();
  }, [handleMarkAsRead]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  const toggleAutoTranslate = async () => {
    const newValue = !autoTranslate;
    setAutoTranslate(newValue);

    // Update user preference
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ auto_translate_messages: newValue })
        .eq('user_id', currentUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating auto-translate preference:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Auto-translate toggle */}
      <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm text-slate-600">Auto-translate messages</span>
        <Button
          variant={autoTranslate ? 'default' : 'outline'}
          size="sm"
          onClick={toggleAutoTranslate}
          disabled={isTranslating}
        >
          <Languages className="h-4 w-4 mr-1" />
          {autoTranslate ? 'On' : 'Off'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messageList.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messageList.map((message) => {
            const translatedContent = translations[message.id];
            const showTranslation = autoTranslate && translatedContent && !message.isOwn;

            return (
              <div key={message.id}>
                <MessageBubble
                  message={{
                    id: message.id,
                    content: message.content,
                    sender_id: message.sender_id,
                    created_at: message.created_at,
                  }}
                  isOwn={message.isOwn}
                />
                {showTranslation && (
                  <div className="mt-1 ml-12 text-sm text-slate-500 italic border-l-2 border-teal-200 pl-2">
                    {translatedContent}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Optimized with React.memo to prevent unnecessary re-renders
export const MessageThread = React.memo(MessageThreadComponent, (prevProps, nextProps) => {
  return (
    prevProps.postId === nextProps.postId &&
    prevProps.postType === nextProps.postType &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.otherUserId === nextProps.otherUserId &&
    prevProps.onMarkAsRead === nextProps.onMarkAsRead
  );
});

