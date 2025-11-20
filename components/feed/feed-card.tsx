"use client";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Plane, Ship, CheckCircle2, Clock, DollarSign, Zap } from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { cn } from "../../lib/utils";
import { VerifiedSailorBadge } from "../badges/verified-sailor-badge";
import { VerifiedBadge } from "../badges/verified-badge";
import { VerifiedCheckBadge } from "../badges/verified-check-badge";
import { SupporterBadge } from "../badges/supporter-badge";
import { MatchScoreBadge } from "../match-score/match-score-badge";
import { MatchScoreBreakdown } from "../../lib/matching/match-score";

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
  match_score_breakdown?: MatchScoreBreakdown;
  trip_type?: "plane" | "boat"; // For match score display
  user_id: string;
  created_at: string;
  user_verified_sailor?: boolean;
  user_verified_identity?: boolean;
  user_subscribed?: boolean;
  user_supporter?: boolean;
  emergency?: boolean;
}

interface FeedCardProps {
  item: FeedItem;
  onClick: () => void;
}

export function FeedCard({ item, onClick }: FeedCardProps) {
  const isTrip = item.type === "trip";
  const isFast = isTrip
    ? item.departure_date &&
      isValid(parseISO(item.departure_date)) &&
      differenceInDays(parseISO(item.departure_date), new Date()) <= 10
    : item.deadline_earliest &&
      isValid(parseISO(item.deadline_earliest)) &&
      differenceInDays(parseISO(item.deadline_earliest), new Date()) <= 10;

  const getDateRange = () => {
    if (isTrip) {
      if (item.departure_date && isValid(parseISO(item.departure_date))) {
        return format(parseISO(item.departure_date), "MMM d");
      }
      if (
        item.eta_window_start &&
        item.eta_window_end &&
        isValid(parseISO(item.eta_window_start)) &&
        isValid(parseISO(item.eta_window_end))
      ) {
        return `${format(parseISO(item.eta_window_start), "MMM d")} - ${format(parseISO(item.eta_window_end), "MMM d")}`;
      }
    } else {
      if (
        item.deadline_earliest &&
        item.deadline_latest &&
        isValid(parseISO(item.deadline_latest))
      ) {
        return `Need by ${format(parseISO(item.deadline_latest), "MMM d")}`;
      }
    }
    return "Dates TBD";
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
              isTrip ? "bg-blue-100" : "bg-purple-100"
            )}
          >
            {isTrip ? (
              <Plane className="h-6 w-6 text-blue-600" />
            ) : (
              <Ship className="h-6 w-6 text-purple-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900">
                    {item.from_location}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-900">
                    {item.to_location}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{getDateRange()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Match Score Badge */}
                {item.match_score_breakdown && item.trip_type && (
                  <MatchScoreBadge
                    score={item.match_score_breakdown}
                    tripType={item.trip_type}
                  />
                )}
                {item.user_supporter && (
                  <SupporterBadge size="sm" />
                )}
                {item.user_subscribed && (
                  <VerifiedCheckBadge size="sm" />
                )}
                {item.user_verified_sailor && (
                  <VerifiedSailorBadge size="sm" />
                )}
                {item.user_verified_identity && (
                  <VerifiedBadge size="sm" />
                )}
              </div>
            </div>

            {/* Reward/Capacity */}
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-900">
                {isTrip
                  ? `Spare: ${item.spare_kg}kg`
                  : `Reward: $${item.max_reward?.toLocaleString()}`}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.emergency && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Emergency
                </Badge>
              )}
              <Badge
                variant={isFast ? "default" : "secondary"}
                className={cn(
                  isFast
                    ? "bg-teal-100 text-teal-800 border-teal-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                )}
              >
                {isFast ? "Fast (3–10 days)" : "Cheap (2–8 weeks, zero customs)"}
              </Badge>
              {isTrip && (
                <Badge variant="outline" className="text-xs">
                  {item.spare_volume_liters}L capacity
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

