/**
 * MessageInput Component
 * 
 * Input field and send button for sending messages
 */

"use client";

import { useState, FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Loader2 } from 'lucide-react';
import { usePostMessages } from '../../lib/hooks/usePostMessages';

interface MessageInputProps {
  postId: string;
  postType: 'trip' | 'request';
  currentUserId: string;
  otherUserId: string;
  disabled?: boolean;
}

export function MessageInput({
  postId,
  postType,
  currentUserId,
  otherUserId,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const { sendMessage, isSending } = usePostMessages({
    postId,
    postType,
    currentUserId,
    otherUserId,
    enabled: true,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || disabled) return;

    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-slate-200 p-4">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={isSending || disabled}
        />
        <Button
          type="submit"
          disabled={!message.trim() || isSending || disabled}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        All communication stays on SpareCarry for safety and protection.
      </p>
    </form>
  );
}

