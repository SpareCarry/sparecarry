/**
 * Watchlist Button Component
 *
 * Toggle button to add/remove items from watchlist
 */

"use client";

import React, { useState, useEffect } from "react";
import { Heart, HeartOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cn } from "../lib/utils";

export interface WatchlistButtonProps {
  userId: string;
  type: "route" | "item";
  payload: {
    from_location?: string;
    to_location?: string;
    date_range?: { start: string; end: string };
    request_id?: string;
    trip_id?: string;
    title?: string;
    description?: string;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
  onToggle?: (isWatched: boolean) => void;
}

export function WatchlistButton({
  userId,
  type,
  payload,
  className,
  size = "md",
  onToggle,
}: WatchlistButtonProps) {
  const [isWatched, setIsWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const supabase = createClient() as SupabaseClient;

  type WatchlistRecord = {
    id: string;
  };

  // Check if already in watchlist
  useEffect(() => {
    async function checkWatchlist() {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if watchlist item exists (JSONB comparison)
        const { data, error } = await supabase
          .from("watchlists")
          .select("id")
          .eq("user_id", userId)
          .eq("type", type)
          .eq("payload->>from_location", payload.from_location || "")
          .eq("payload->>to_location", payload.to_location || "")
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = not found
          console.error("Error checking watchlist:", error);
        } else {
          setIsWatched(!!data);
        }
      } catch (error) {
        console.error("Error checking watchlist:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkWatchlist();
  }, [userId, type, payload, supabase]);

  const handleToggle = async () => {
    if (!userId || isLoading || isChecking) return;

    setIsLoading(true);

    try {
      if (isWatched) {
        // Remove from watchlist (find by matching payload fields)
        const { data: existing, error: findError } = await supabase
          .from("watchlists")
          .select("id")
          .eq("user_id", userId)
          .eq("type", type)
          .limit(1)
          .single();

        const record = existing as WatchlistRecord | null;

        if (findError || !record) {
          throw new Error("Watchlist item not found");
        }

        const { error } = await supabase
          .from("watchlists")
          .delete()
          .eq("id", record.id);

        if (error) throw error;

        setIsWatched(false);
        onToggle?.(false);
      } else {
        // Check if already exists first
        const { data: existing } = await supabase
          .from("watchlists")
          .select("id")
          .eq("user_id", userId)
          .eq("type", type)
          .limit(1)
          .single();

        if (!existing) {
          // Add to watchlist
          const { error } = await supabase.from("watchlists").insert({
            user_id: userId,
            type,
            payload,
          });

          if (error) throw error;
        }

        setIsWatched(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Map size to Button's accepted sizes
  const buttonSize = size === "md" ? "default" : size;

  if (isChecking) {
    return (
      <Button
        variant="ghost"
        size={buttonSize}
        disabled
        className={cn(className)}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isWatched ? "default" : "outline"}
      size={buttonSize}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(className)}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isWatched ? (
        <>
          <HeartOff className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Watching</span>
        </>
      ) : (
        <>
          <Heart className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Watch</span>
        </>
      )}
    </Button>
  );
}
