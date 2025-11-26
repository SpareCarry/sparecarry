"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plane, Ship, CheckCircle2, Clock, DollarSign, MapPin, MessageCircle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { PostMessageThreadModal } from "../messaging/PostMessageThreadModal";
import { SuggestedMatches } from "../matching/SuggestedMatches";
import { WatchlistButton } from "../WatchlistButton";
import { TrustBadges } from "../TrustBadges";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../hooks/useUser";
import { WhatsAppButton } from "../whatsapp/whatsapp-button";
import { CurrencyDisplay } from "../currency/currency-display";

type MatchRecord = {
  id: string;
};

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
  user_verified_identity?: boolean;
  user_subscribed?: boolean;
}

interface FeedDetailModalProps {
  item: FeedItem;
  open: boolean;
  onClose: () => void;
}

export function FeedDetailModal({ item, open, onClose }: FeedDetailModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showMessageThread, setShowMessageThread] = useState(false);
  const isTrip = item.type === "trip";

  // Use shared hook to prevent duplicate queries
  const { user: currentUser } = useUser();

  const isInvolved = currentUser?.id === item.user_id;

  // Fetch user phone for WhatsApp
  const { data: userProfile } = useQuery<{ phone?: string | null } | null>({
    queryKey: ["user-profile-phone", item.user_id],
    queryFn: async (): Promise<{ phone?: string | null } | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", item.user_id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching user phone:", error);
        return null;
      }
      return (data as { phone?: string | null } | null) ?? null;
    },
    enabled: !isInvolved && !!item.user_id,
  });

  const handleMessage = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check if match already exists or create new one
      if (isTrip) {
        // User viewing a trip - they want to create a request match
        // For now, redirect to post request page
        router.push("/home/post-request");
      } else {
        // User viewing a request - find matching trips or create match
        // Check for existing matches first
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("request_id", item.id)
          .eq("status", "pending")
          .limit(1)
          .single();

        const matchRecord = (existingMatch ?? null) as MatchRecord | null;

        if (matchRecord) {
          router.push(`/home/messages/${matchRecord.id}`);
        } else {
          // For now, show message that they need to wait for a match
          alert("No matching trips found yet. We'll notify you when someone can carry your item!");
        }
      }

      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    if (isTrip) {
      if (item.departure_date && isValid(parseISO(item.departure_date))) {
        return format(parseISO(item.departure_date), "MMMM d, yyyy");
      }
      if (
        item.eta_window_start &&
        item.eta_window_end &&
        isValid(parseISO(item.eta_window_start)) &&
        isValid(parseISO(item.eta_window_end))
      ) {
        return `${format(parseISO(item.eta_window_start), "MMM d")} - ${format(parseISO(item.eta_window_end), "MMM d, yyyy")}`;
      }
    } else {
      if (
        item.deadline_earliest &&
        item.deadline_latest &&
        isValid(parseISO(item.deadline_latest))
      ) {
        return `Need by ${format(parseISO(item.deadline_latest), "MMMM d, yyyy")}`;
      }
    }
    return "Dates TBD";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isTrip ? "bg-blue-100" : "bg-purple-100"
              )}
            >
              {isTrip ? (
                <Plane className="h-6 w-6 text-blue-600" />
              ) : (
                <Ship className="h-6 w-6 text-purple-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isTrip ? "Trip Available" : "Delivery Request"}
              </DialogTitle>
              <DialogDescription>
                {item.from_location} → {item.to_location}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Route */}
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="h-5 w-5 text-slate-400" />
            <div>
              <div className="font-medium">{item.from_location}</div>
              <div className="text-sm">→ {item.to_location}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-5 w-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-500">Timeline</div>
              <div className="font-medium">{getDateRange()}</div>
            </div>
          </div>

          {/* Reward/Capacity */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-500">
                {isTrip ? "Available Capacity" : "Reward Offered"}
              </div>
              <div className="font-semibold text-lg text-slate-900">
                {isTrip
                  ? `${item.spare_kg}kg / ${item.spare_volume_liters}L`
                  : <CurrencyDisplay amount={item.max_reward || 0} showSecondary={false} />}
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <TrustBadges
              id_verified={item.user_verified_identity || false}
              email_verified={true} // Assume verified if user exists
              premium_member={item.user_subscribed || false}
              size="sm"
            />
            {isTrip && item.spare_volume_liters && (
              <Badge variant="outline">
                {item.spare_volume_liters}L capacity
              </Badge>
            )}
          </div>

          {/* Watchlist Button */}
          {currentUser?.id && (
            <div className="pt-2">
              <WatchlistButton
                userId={currentUser.id}
                type={isTrip ? 'route' : 'item'}
                payload={
                  isTrip
                    ? {
                        from_location: item.from_location,
                        to_location: item.to_location,
                        trip_id: item.id,
                      }
                    : {
                        from_location: item.from_location,
                        to_location: item.to_location,
                        request_id: item.id,
                        title: 'Request',
                      }
                }
                size="sm"
              />
            </div>
          )}

          {/* Message Button - Show if user is involved in the post */}
          {isInvolved && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => setShowMessageThread(true)}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Open Messages
              </Button>
            </div>
          )}

          {/* WhatsApp Button for non-involved users */}
          {!isInvolved && userProfile?.phone && (
            <div className="pt-4 border-t">
              <WhatsAppButton
                phone={userProfile.phone}
                title={isTrip ? "Trip" : "Request"}
                origin={item.from_location}
                destination={item.to_location}
                className="w-full bg-green-600 hover:bg-green-700"
              />
            </div>
          )}
          
          {/* Fallback to message if no phone */}
          {!isInvolved && !userProfile?.phone && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleMessage}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {loading ? "Loading..." : "Message"}
              </Button>
            </div>
          )}
        </div>

        {/* Suggested Matches */}
        {currentUser?.id && (
          <div className="pt-4 border-t mt-4">
            <SuggestedMatches
              postType={item.type}
              postId={item.id}
              currentUserId={currentUser.id}
              maxSuggestions={3}
            />
          </div>
        )}
      </DialogContent>

      {/* Message Thread Modal */}
      {currentUser?.id && (
        <PostMessageThreadModal
          open={showMessageThread}
          onClose={() => setShowMessageThread(false)}
          postId={item.id}
          postType={item.type}
          currentUserId={currentUser.id}
        />
      )}
    </Dialog>
  );
}

