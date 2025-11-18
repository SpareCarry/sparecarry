"use client";

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedCard } from "@/components/feed/feed-card";
import { FeedDetailModal } from "@/components/feed/feed-detail-modal";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CreditBanner } from "@/components/referral/credit-banner";
import { ReferralLeaderboard } from "@/components/referral/referral-leaderboard";
import { calculateMatchScore, MatchScoreBreakdown } from "@/lib/matching/match-score";
import { NotificationPermissionRequest } from "@/components/notifications/permission-request";
import { TrustBanner } from "@/components/banners/trust-banner";

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

async function fetchFeed(page: number = 0, userId?: string): Promise<{
  items: FeedItem[];
  hasMore: boolean;
}> {
  const supabase = createClient();
  
  // Get current user for match score calculation
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  
  const pageSize = 10;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Fetch trips with user subscription and supporter status
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select(`
      *,
      users!trips_user_id_fkey(subscription_status, supporter_status)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tripsError) throw tripsError;

  // Fetch requests with user subscription and supporter status
  const { data: requests, error: requestsError } = await supabase
    .from("requests")
    .select(`
      *,
      users!requests_user_id_fkey(subscription_status, supporter_status)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (requestsError) throw requestsError;

  // Fetch all relevant profiles
  const userIds = [
    ...(trips || []).map((t) => t.user_id),
    ...(requests || []).map((r) => r.user_id),
  ];
  const uniqueUserIds = [...new Set(userIds)];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, verified_sailor_at, stripe_identity_verified_at")
    .in("user_id", uniqueUserIds);

  const profilesMap = new Map(
    (profiles || []).map((p) => [
      p.user_id,
      {
        verified_sailor: !!p.verified_sailor_at,
        verified_identity: !!p.stripe_identity_verified_at,
      },
    ])
  );

  // Combine and format
  const tripItems: FeedItem[] = (trips || []).map((trip) => {
    const profile = profilesMap.get(trip.user_id);
    const user = Array.isArray(trip.users) ? trip.users[0] : trip.users;
    const isSubscriber = user?.subscription_status === "active" || user?.subscription_status === "trialing";
    const isSupporter = user?.supporter_status === "active";
    return {
      id: trip.id,
      type: "trip" as const,
      from_location: trip.from_location,
      to_location: trip.to_location,
      departure_date: trip.departure_date,
      eta_window_start: trip.eta_window_start,
      eta_window_end: trip.eta_window_end,
      spare_kg: trip.spare_kg,
      spare_volume_liters: trip.spare_volume_liters,
      user_id: trip.user_id,
      created_at: trip.created_at,
      match_score: isSupporter ? 2000 : isSubscriber ? 1000 : 0, // Supporters get highest priority
      user_verified_sailor: profile?.verified_sailor || false,
      user_verified_identity: profile?.verified_identity || false,
      user_subscribed: isSubscriber || false,
      user_supporter: isSupporter || false,
    };
  });

  const requestItems: FeedItem[] = (requests || []).map((request) => {
    const profile = profilesMap.get(request.user_id);
    const user = Array.isArray(request.users) ? request.users[0] : request.users;
    const isSubscriber = user?.subscription_status === "active" || user?.subscription_status === "trialing";
    const isSupporter = user?.supporter_status === "active";
    return {
      id: request.id,
      type: "request" as const,
      from_location: request.from_location,
      to_location: request.to_location,
      deadline_earliest: request.deadline_earliest,
      deadline_latest: request.deadline_latest,
      max_reward: request.max_reward,
      user_id: request.user_id,
      created_at: request.created_at,
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
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => fetchFeed(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading feed</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md"
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

      {/* Trust Banners */}
      <div className="mb-4 space-y-3">
        <TrustBanner variant="first-delivery" />
        <TrustBanner variant="promo-period" />
      </div>

      {/* Credit Banner */}
      <CreditBanner />

      {/* Referral Leaderboard */}
      <div className="mb-4">
        <ReferralLeaderboard />
      </div>

      {/* Notification Permission Request */}
      <NotificationPermissionRequest />

      <div className="space-y-4">
        {items.map((item) => (
          <FeedCard
            key={`${item.type}-${item.id}`}
            item={item}
            onClick={() => setSelectedItem(item)}
          />
        ))}
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

