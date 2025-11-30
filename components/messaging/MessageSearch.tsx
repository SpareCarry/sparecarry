/**
 * MessageSearch Component
 *
 * Search through conversation messages
 */

"use client";

import { useState, useMemo } from "react";
import { Input } from "../ui/input";
import { Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

interface MessageSearchProps {
  messages: Message[];
  onMessageSelect?: (messageId: string) => void;
  className?: string;
}

export function MessageSearch({
  messages,
  onMessageSelect,
  className,
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    return messages
      .filter((msg) => msg.content.toLowerCase().includes(query))
      .slice(0, 10); // Limit to 10 results
  }, [messages, searchQuery]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-slate-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSelect = (messageId: string) => {
    onMessageSelect?.(messageId);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
        <Input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filteredMessages.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleSelect(msg.id)}
                  className="w-full rounded p-2 text-left transition-colors hover:bg-slate-100"
                >
                  <p className="line-clamp-2 text-sm text-slate-900">
                    {highlightText(msg.content, searchQuery)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              No messages found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
