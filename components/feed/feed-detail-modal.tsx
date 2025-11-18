"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Ship, CheckCircle2, Clock, DollarSign, MapPin, MessageCircle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const isTrip = item.type === "trip";

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

        if (existingMatch) {
          router.push(`/home/messages/${existingMatch.id}`);
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
                  : `$${item.max_reward?.toLocaleString()}`}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-teal-100 text-teal-800 border-teal-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
            {isTrip && item.spare_volume_liters && (
              <Badge variant="outline">
                {item.spare_volume_liters}L capacity
              </Badge>
            )}
          </div>

          {/* Message Button */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

