"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { FeedCard } from "../../components/feed/feed-card";
import { FeedDetailModal } from "../../components/feed/feed-detail-modal";
import { Loader2 } from "lucide-react";
import { SkeletonFeedItem } from "../../components/ui/skeleton";
import { createClient } from "../../lib/supabase/client";
import { CreditBanner } from "../../components/referral/credit-banner";
import { ReferralLeaderboard } from "../../components/referral/referral-leaderboard";
import {
  calculateMatchScore,
  MatchScoreBreakdown,
} from "../../lib/matching/match-score";
import { NotificationPermissionRequest } from "../../components/notifications/permission-request";
import { ErrorBoundary } from "../../app/_components/ErrorBoundary";
import { TopRoutes } from "../../components/TopRoutes";
import { PromoCardWrapper } from "../../components/promo/PromoCardWrapper";

interface FeedItem {
  id: string;
  type: "trip" | "request";
  from_location: string;
  to_location: string;
  departure_date?: string;
  eta_window_start?: string;
  eta_window_end?: string;
  deadline_earliest?: string;
  deadline_latest?: string;
  reward_amount?: number;
  spare_kg?: number;
  spare_volume_liters?: number;
  max_reward?: number;
  match_score?: number;
  user_id: string;
  created_at: string;
  user_verified_sailor?: boolean;
  user_verified_identity?: boolean;
  user_subscribed?: boolean;
  user_supporter?: boolean;
  emergency?: boolean;
}

// Helper function to add timeout to promises to prevent hanging
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Query timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

async function fetchFeed(
  page: number = 0,
  userId?: string
): Promise<{
  items: FeedItem[];
  hasMore: boolean;
}> {
  try {
    const supabase = createClient();

    const pageSize = 10;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Fetch trips and requests in parallel for better performance
    const [tripsResult, requestsResult] = await Promise.allSettled([
      (async () => {
        try {
          const queryBuilder = supabase
            .from("trips")
            .select(
              `
              *,
              users!trips_user_id_fkey(subscription_status, supporter_status)
            `
            )
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .range(from, to);

          const queryPromise = queryBuilder as unknown as Promise<{
            data: any;
            error: any;
          }>;
          const { data: tripsData, error: tripsError } = await withTimeout(
            queryPromise,
            5000
          );

          if (tripsError) {
            console.warn("Error fetching trips:", tripsError);
            return [];
          }
          return tripsData || [];
        } catch (error) {
          console.warn("Error fetching trips (timeout or exception):", error);
          return [];
        }
      })(),
      (async () => {
        try {
          const queryBuilder = supabase
            .from("requests")
            .select(
              `
              *,
              users!requests_user_id_fkey(subscription_status, supporter_status)
            `
            )
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .range(from, to);

          const queryPromise = queryBuilder as unknown as Promise<{
            data: any;
            error: any;
          }>;
          const { data: requestsData, error: requestsError } =
            await withTimeout(queryPromise, 5000);

          if (requestsError) {
            console.warn("Error fetching requests:", requestsError);
            return [];
          }
          return requestsData || [];
        } catch (error) {
          console.warn(
            "Error fetching requests (timeout or exception):",
            error
          );
          return [];
        }
      })(),
    ]);

    const trips = tripsResult.status === "fulfilled" ? tripsResult.value : [];
    const requests =
      requestsResult.status === "fulfilled" ? requestsResult.value : [];

    // Fetch all relevant profiles in parallel - handle errors gracefully
    const userIds = [
      ...(trips || []).map((t: any) => t.user_id),
      ...(requests || []).map((r: any) => r.user_id),
    ];
    const uniqueUserIds = [...new Set(userIds)];

    let profilesMap = new Map();
    if (uniqueUserIds.length > 0) {
      try {
        const queryBuilder = supabase
          .from("profiles")
          .select("user_id, verified_sailor_at, stripe_identity_verified_at")
          .in("user_id", uniqueUserIds);

        const queryPromise = queryBuilder as unknown as Promise<{
          data: any;
          error: any;
        }>;
        const { data: profiles, error: profilesError } = await withTimeout(
          queryPromise,
          5000
        );

        if (profilesError) {
          console.warn("Error fetching profiles:", profilesError);
        } else {
          profilesMap = new Map(
            (profiles || []).map((p: any) => [
              p.user_id,
              {
                verified_sailor: !!p.verified_sailor_at,
                verified_identity: !!p.stripe_identity_verified_at,
              },
            ])
          );
        }
      } catch (error) {
        console.warn("Error fetching profiles (timeout or exception):", error);
        // Continue with empty profiles map
      }
    }

    // Combine and format - handle missing data gracefully
    const tripItems: FeedItem[] = (trips || [])
      .filter((trip: any) => trip && trip.id && trip.user_id) // Filter out invalid trips first
      .map((trip: any) => {
        const profile = profilesMap.get(trip.user_id);
        const user = Array.isArray(trip.users) ? trip.users[0] : trip.users;
        const isSubscriber =
          user?.subscription_status === "active" ||
          user?.subscription_status === "trialing";
        const isSupporter = user?.supporter_status === "active";
        return {
          id: trip.id,
          type: "trip" as const,
          from_location: trip.from_location || "",
          to_location: trip.to_location || "",
          departure_date: trip.departure_date,
          eta_window_start: trip.eta_window_start,
          eta_window_end: trip.eta_window_end,
          spare_kg: trip.spare_kg,
          spare_volume_liters: trip.spare_volume_liters,
          user_id: trip.user_id,
          created_at: trip.created_at || new Date().toISOString(),
          match_score: isSupporter ? 2000 : isSubscriber ? 1000 : 0, // Supporters get highest priority
          user_verified_sailor: profile?.verified_sailor || false,
          user_verified_identity: profile?.verified_identity || false,
          user_subscribed: isSubscriber || false,
          user_supporter: isSupporter || false,
        };
      });

    const requestItems: FeedItem[] = (requests || [])
      .filter((request: any) => request && request.id && request.user_id) // Filter out invalid requests first
      .map((request: any) => {
        const profile = profilesMap.get(request.user_id);
        const user = Array.isArray(request.users)
          ? request.users[0]
          : request.users;
        const isSubscriber =
          user?.subscription_status === "active" ||
          user?.subscription_status === "trialing";
        const isSupporter = user?.supporter_status === "active";
        return {
          id: request.id,
          type: "request" as const,
          from_location: request.from_location || "",
          to_location: request.to_location || "",
          deadline_earliest: request.deadline_earliest,
          deadline_latest: request.deadline_latest,
          max_reward: request.max_reward,
          user_id: request.user_id,
          created_at: request.created_at || new Date().toISOString(),
          match_score: isSupporter ? 2000 : isSubscriber ? 1000 : 0, // Supporters get highest priority
          user_verified_sailor: profile?.verified_sailor || false,
          user_verified_identity: profile?.verified_identity || false,
          emergency: request.emergency || false,
          user_subscribed: isSubscriber || false,
          user_supporter: isSupporter || false,
        };
      });

    // Combine and sort by supporter status first, then subscription status, then match score, then created_at
    const allItems = [...tripItems, ...requestItems].sort((a, b) => {
      // Supporters first (highest priority)
      if (a.user_supporter && !b.user_supporter) return -1;
      if (!a.user_supporter && b.user_supporter) return 1;

      // Then subscribers
      if (a.user_subscribed && !b.user_subscribed) return -1;
      if (!a.user_subscribed && b.user_subscribed) return 1;

      // Then by match score
      if (a.match_score && b.match_score) {
        return b.match_score - a.match_score;
      }

      // Finally by created_at
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return {
      items: allItems.slice(0, pageSize),
      hasMore: allItems.length >= pageSize,
    };
  } catch (error) {
    // If anything goes wrong, return empty results instead of throwing
    console.error("Error in fetchFeed:", error);
    return {
      items: [],
      hasMore: false,
    };
  }
}

export default function BrowsePage() {
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<{
    items: FeedItem[];
    hasMore: boolean;
  }>({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => fetchFeed(pageParam as number),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    retry: false, // Don't retry automatically - let user click retry button
    refetchOnWindowFocus: false, // Prevent refetch on window focus to avoid flickering
    refetchOnMount: false, // Don't refetch on mount if we have cached data
    refetchOnReconnect: false, // Prevent refetch on reconnect to avoid flickering
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes to prevent unnecessary refetches
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes (formerly cacheTime)
    placeholderData: keepPreviousData, // Keep previous data visible while refetching to prevent flickering
  });

  // Use ref-based memoization to prevent flickering
  // Only update when item IDs actually change, not when data object reference changes
  const itemsRef = useRef<FeedItem[]>([]);
  const itemsKeyRef = useRef<string>("");

  // Calculate stable key from item IDs
  const currentItemsKey = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return "";

    const allItemIds: string[] = [];
    let totalCount = 0;

    data.pages.forEach((page) => {
      if (page.items) {
        totalCount += page.items.length;
        page.items.forEach((item) => {
          if (item?.id) {
            allItemIds.push(item.id);
          }
        });
      }
    });

    // Return empty string if no items
    if (allItemIds.length === 0) return "";

    // Create stable key: count:ids
    return `${totalCount}:${allItemIds.join(",")}`;
  }, [data?.pages]);

  // Update items only when key changes
  const items = useMemo(() => {
    // If key hasn't changed, return cached items
    if (
      currentItemsKey === itemsKeyRef.current &&
      itemsRef.current.length > 0
    ) {
      return itemsRef.current;
    }

    // If no data, return empty array
    if (!data?.pages || data.pages.length === 0 || !currentItemsKey) {
      itemsRef.current = [];
      itemsKeyRef.current = "";
      return [];
    }

    // Flatten pages
    const flattened = data.pages.flatMap((page) => page.items ?? []);

    // Update cache
    itemsRef.current = flattened;
    itemsKeyRef.current = currentItemsKey;

    return flattened;
  }, [currentItemsKey, data?.pages]);

  // Memoize the click handler to prevent FeedCard re-renders
  const handleItemClick = useCallback((item: FeedItem) => {
    setSelectedItem(item);
  }, []);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Only show loading skeleton if we have no data at all (first load)
  // If we have cached data, show it immediately even if refetching
  const hasPages =
    data &&
    (data as any).pages &&
    Array.isArray((data as any).pages) &&
    (data as any).pages.length > 0;
  if (isLoading && !hasPages) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <div className="mb-2 h-9 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonFeedItem key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    // Log error for debugging
    console.error("Browse page error:", error);

    // Try to get more details about the error
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Something went wrong while loading the feed";

    // Check if it's a network error or Supabase error
    const isNetworkError =
      errorMessage.includes("fetch") || errorMessage.includes("network");
    const isSupabaseError =
      errorMessage.includes("PGRST") || errorMessage.includes("Supabase");

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md px-4 text-center">
          <p className="mb-2 text-lg font-medium text-red-600">
            Error loading feed
          </p>
          <p className="mb-2 text-sm text-slate-600">
            {isNetworkError
              ? "Unable to connect to the server. Please check your internet connection."
              : isSupabaseError
                ? "Database connection issue. Please try again in a moment."
                : errorMessage}
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mb-4 text-left text-xs text-slate-500">
              <summary className="mb-2 cursor-pointer">
                Technical details (dev only)
              </summary>
              <pre className="max-h-40 overflow-auto rounded bg-slate-100 p-2">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              console.log("Retrying feed fetch...");
              refetch();
            }}
            className="rounded-md bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-6 pb-24 lg:pb-6"
      id="main-content"
      role="main"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Browse</h1>
        <p className="mt-1 text-slate-600">
          Find trips and requests that match your needs
        </p>
      </div>

      {/* Promo Card */}
      <div className="mb-4">
        <ErrorBoundary fallback={null}>
          <PromoCardWrapper />
        </ErrorBoundary>
      </div>

      {/* Credit Banner - wrap in error boundary to prevent crashes */}
      <ErrorBoundary fallback={null}>
        <CreditBanner />
      </ErrorBoundary>

      {/* Referral Leaderboard - wrap in error boundary to prevent crashes */}
      <div className="mb-4">
        <ErrorBoundary fallback={null}>
          <ReferralLeaderboard />
        </ErrorBoundary>
      </div>

      {/* Top Routes */}
      <div className="mb-4">
        <ErrorBoundary fallback={null}>
          <TopRoutes limit={5} />
        </ErrorBoundary>
      </div>

      {/* Notification Permission Request - wrap in error boundary to prevent crashes */}
      <ErrorBoundary fallback={null}>
        <NotificationPermissionRequest />
      </ErrorBoundary>

      <div className="space-y-4">
        {items.length === 0 && !isLoading ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-600">
              No trips or requests found yet.
            </p>
            <p className="text-sm text-slate-500">
              Be the first to post a trip or request!
            </p>
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <FeedCard
              key={`${item.type}-${item.id}`}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))
        ) : null}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {isFetchingNextPage && (
        <div className="mt-4 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonFeedItem key={`loading-${i}`} />
          ))}
        </div>
      )}

      {selectedItem && (
        <FeedDetailModal
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
