/**
 * Hook for auto-saving message drafts
 * Saves to localStorage and restores on mount
 */

import { useState, useEffect, useRef } from "react";

interface UseMessageDraftOptions {
  conversationId: string;
  conversationType: "match" | "post";
  enabled?: boolean;
}

export function useMessageDraft({
  conversationId,
  conversationType,
  enabled = true,
}: UseMessageDraftOptions) {
  const storageKey = `message-draft:${conversationType}:${conversationId}`;
  const [draft, setDraft] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDraft(saved);
      }
    } catch (error) {
      console.warn("Failed to load message draft:", error);
    }
  }, [storageKey, enabled]);

  // Save draft with debounce
  const saveDraft = (value: string) => {
    if (!enabled) return;

    setDraft(value);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save after 1 second of no typing
    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (value.trim()) {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn("Failed to save message draft:", error);
      }
    }, 1000);
  };

  // Clear draft
  const clearDraft = () => {
    setDraft("");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to clear message draft:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    setDraft: saveDraft,
    clearDraft,
  };
}
