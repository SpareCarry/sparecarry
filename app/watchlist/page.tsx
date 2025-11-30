/**
 * Watchlist Screen
 *
 * Displays user's saved routes and items
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader2, Heart, MapPin, Package, Trash2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface WatchlistItem {
  id: string;
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
  created_at: string;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadWatchlist() {
      setIsLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("watchlists")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setItems(data || []);
      } catch (err) {
        console.error("Error loading watchlist:", err);
        setError("Failed to load watchlist");
      } finally {
        setIsLoading(false);
      }
    }

    loadWatchlist();
  }, [supabase, router]);

  const handleRemove = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Error removing from watchlist:", err);
    }
  };

  const handleViewItem = (item: WatchlistItem) => {
    if (item.type === "item") {
      if (item.payload.request_id) {
        router.push(`/home/post-request?id=${item.payload.request_id}`);
      } else if (item.payload.trip_id) {
        router.push(`/home/post-trip?id=${item.payload.trip_id}`);
      }
    } else {
      // Route: navigate to feed with filters
      router.push(
        `/home?from=${item.payload.from_location}&to=${item.payload.to_location}`
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
          <Heart className="h-8 w-8 text-teal-600" />
          My Watchlist
        </h1>
        <p className="text-slate-600">
          Saved routes and items you&apos;re watching for matches
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Heart className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="mb-4 text-slate-500">Your watchlist is empty</p>
              <p className="text-sm text-slate-400">
                Add routes or items to your watchlist to get notified when
                matches become available
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="transition-colors hover:border-teal-300"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant={
                          item.type === "route" ? "default" : "secondary"
                        }
                      >
                        {item.type === "route" ? "Route" : "Item"}
                      </Badge>
                      {item.type === "item" && item.payload.title && (
                        <h3 className="font-semibold text-slate-900">
                          {item.payload.title}
                        </h3>
                      )}
                    </div>

                    {item.type === "route" ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {item.payload.from_location} →{" "}
                            {item.payload.to_location}
                          </span>
                        </div>
                        {item.payload.date_range && (
                          <div className="ml-6 text-sm text-slate-600">
                            {format(
                              new Date(item.payload.date_range.start),
                              "MMM d"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(item.payload.date_range.end),
                              "MMM d, yyyy"
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {item.payload.description && (
                          <p className="text-sm text-slate-600">
                            {item.payload.description}
                          </p>
                        )}
                        {item.payload.from_location &&
                          item.payload.to_location && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {item.payload.from_location} →{" "}
                                {item.payload.to_location}
                              </span>
                            </div>
                          )}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-slate-500">
                      Added {format(new Date(item.created_at), "MMM d, yyyy")}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewItem(item)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
