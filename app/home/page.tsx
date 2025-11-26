"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedCard } from "../../components/feed/feed-card";
import { FeedDetailModal } from "../../components/feed/feed-detail-modal";
import { Loader2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { CreditBanner } from "../../components/referral/credit-banner";
import { ReferralLeaderboard } from "../../components/referral/referral-leaderboard";
import { calculateMatchScore, MatchScoreBreakdown } from "../../lib/matching/match-score";
import { NotificationPermissionRequest } from "../../components/notifications/permission-request";
import { ErrorBoundary } from "../../app/_components/ErrorBoundary";
import { TopRoutes } from "../../components/TopRoutes";
import { PromoCardWrapper } from "../../components/promo/PromoCardWrapper";
import { First3DeliveriesBanner } from "../../components/promo/First3DeliveriesBanner";

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
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function fetchFeed(page: number = 0, userId?: string): Promise<{
  items: FeedItem[];
  hasMore: boolean;
}> {
  try {
    const supabase = createClient();
    
    const pageSize = 10;
    const from = page * pageSize;
    const to = from + pageSize - 1;

  // Fetch trips - handle errors gracefully with timeout
  let trips: any[] = [];
  try {
    const queryBuilder = supabase
      .from("trips")
      .select(`
        *,
        users!trips_user_id_fkey(subscription_status, supporter_status)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(from, to);

    // Supabase query builders return promises when awaited
    const queryPromise = queryBuilder as unknown as Promise<{ data: any; error: any }>;
    const { data: tripsData, error: tripsError } = await withTimeout(queryPromise, 8000);

    if (tripsError) {
      console.warn("Error fetching trips:", tripsError);
      // Continue with empty trips array
    } else {
      trips = tripsData || [];
    }
  } catch (error) {
    console.warn("Error fetching trips (timeout or exception):", error);
    // Continue with empty trips array
  }

  // Fetch requests - handle errors gracefully with timeout
  let requests: any[] = [];
  try {
    const queryBuilder = supabase
      .from("requests")
      .select(`
        *,
        users!requests_user_id_fkey(subscription_status, supporter_status)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .range(from, to);

    // Supabase query builders return promises when awaited
    const queryPromise = queryBuilder as unknown as Promise<{ data: any; error: any }>;
    const { data: requestsData, error: requestsError } = await withTimeout(queryPromise, 8000);

    if (requestsError) {
      console.warn("Error fetching requests:", requestsError);
      // Continue with empty requests array
    } else {
      requests = requestsData || [];
    }
  } catch (error) {
    console.warn("Error fetching requests (timeout or exception):", error);
    // Continue with empty requests array
  }

  // Fetch all relevant profiles - handle errors gracefully
  const userIds = [
    ...(trips || []).map((t) => t.user_id),
    ...(requests || []).map((r) => r.user_id),
  ];
  const uniqueUserIds = [...new Set(userIds)];

  let profilesMap = new Map();
  if (uniqueUserIds.length > 0) {
    try {
      const queryBuilder = supabase
        .from("profiles")
        .select("user_id, verified_sailor_at, stripe_identity_verified_at")
        .in("user_id", uniqueUserIds);

      // Supabase query builders return promises when awaited
      const queryPromise = queryBuilder as unknown as Promise<{ data: any; error: any }>;
      const { data: profiles, error: profilesError } = await withTimeout(queryPromise, 8000);

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
    .filter((trip) => trip && trip.id && trip.user_id) // Filter out invalid trips first
    .map((trip) => {
      const profile = profilesMap.get(trip.user_id);
      const user = Array.isArray(trip.users) ? trip.users[0] : trip.users;
      const isSubscriber = user?.subscription_status === "active" || user?.subscription_status === "trialing";
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
    .filter((request) => request && request.id && request.user_id) // Filter out invalid requests first
    .map((request) => {
      const profile = profilesMap.get(request.user_id);
      const user = Array.isArray(request.users) ? request.users[0] : request.users;
      const isSubscriber = user?.subscription_status === "active" || user?.subscription_status === "trialing";
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
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
  const supabase = createClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => fetchFeed(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    retry: false, // Don't retry automatically - let user click retry button
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    // Log error for debugging
    console.error("Browse page error:", error);
    
    // Try to get more details about the error
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : "Something went wrong while loading the feed";
    
    // Check if it's a network error or Supabase error
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    const isSupabaseError = errorMessage.includes('PGRST') || errorMessage.includes('Supabase');
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 mb-2 font-medium text-lg">Error loading feed</p>
          <p className="text-sm text-slate-600 mb-2">
            {isNetworkError 
              ? "Unable to connect to the server. Please check your internet connection."
              : isSupabaseError
              ? "Database connection issue. Please try again in a moment."
              : errorMessage}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-slate-500 mb-4 text-left">
              <summary className="cursor-pointer mb-2">Technical details (dev only)</summary>
              <pre className="bg-slate-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              console.log("Retrying feed fetch...");
              refetch();
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Browse</h1>
        <p className="text-slate-600 mt-1">
          Find trips and requests that match your needs
        </p>
      </div>

      {/* First 3 Deliveries Banner */}
      <div className="mb-4">
        <ErrorBoundary fallback={null}>
          <First3DeliveriesBanner />
        </ErrorBoundary>
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
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No trips or requests found yet.</p>
            <p className="text-sm text-slate-500">
              Be the first to post a trip or request!
            </p>
          </div>
        ) : (
          items.map((item) => (
            <FeedCard
              key={`${item.type}-${item.id}`}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {isFetchingNextPage && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
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

