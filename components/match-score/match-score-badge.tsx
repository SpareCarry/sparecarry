"use client";

import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Info, MapPin, Calendar, Package, Shield } from "lucide-react";
import { MatchScoreBreakdown } from "../../lib/matching/match-score";

interface MatchScoreBadgeProps {
  score: MatchScoreBreakdown;
  tripType: "plane" | "boat";
}

export function MatchScoreBadge({ score, tripType }: MatchScoreBadgeProps) {
  const getScoreColor = (totalScore: number) => {
    if (totalScore >= 80) return "bg-green-500 text-white";
    if (totalScore >= 60) return "bg-teal-500 text-white";
    if (totalScore >= 40) return "bg-yellow-500 text-white";
    return "bg-slate-400 text-white";
  };

  const getMatchLabel = (match: string) => {
    switch (match) {
      case "exact":
      case "perfect":
        return "Perfect";
      case "nearby":
      case "good":
        return "Good";
      case "partial":
      case "tight":
        return "Tight";
      default:
        return "None";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          className={`${getScoreColor(score.totalScore)} cursor-pointer hover:opacity-90 font-bold text-sm px-3 py-1`}
        >
          Match: {score.totalScore}/100
          <Info className="ml-1 h-3 w-3 inline" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Match Score Breakdown</h3>
            <div className="text-3xl font-bold text-teal-600 mb-1">
              {score.totalScore}/100
            </div>
            <p className="text-xs text-slate-500">
              Higher scores = better matches
            </p>
          </div>

          <div className="space-y-3 border-t pt-3">
            {/* Route Score */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Route Match</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {getMatchLabel(score.routeMatch)}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {score.routeScore}/40
              </div>
            </div>

            {/* Date Score */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Date Overlap</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {getMatchLabel(score.dateMatch)}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {score.dateScore}/25
              </div>
            </div>

            {/* Capacity Score */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <Package className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Capacity Fit</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {getMatchLabel(score.capacityMatch)}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {score.capacityScore}/20
              </div>
            </div>

            {/* Trust Score */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <Shield className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Trust Level</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {score.trustLevel}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {score.trustScore}/15
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-slate-500">
              {tripType === "plane" ? "✈" : "⚓"} {tripType === "plane" ? "Plane" : "Boat"} trip
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

