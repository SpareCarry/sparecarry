/**
 * Karma Points Display Component
 * 
 * Shows user's karma points with explanation, progress, and gamification
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Heart, Info, Trophy, TrendingUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useUser } from "../../hooks/useUser";

export function KarmaDisplay() {
  const supabase = createClient();

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: userData } = useQuery({
    queryKey: ["user-karma-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("karma_points")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.warn("Error fetching karma points:", error);
          return { karma_points: 0 };
        }
        return data || { karma_points: 0 };
      } catch (error) {
        console.warn("Exception fetching karma points:", error);
        return { karma_points: 0 };
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
  });

  const karmaPoints = userData?.karma_points || 0;

  // Calculate progress to next milestone (every 100 points)
  const currentMilestone = Math.floor(karmaPoints / 100) * 100;
  const nextMilestone = currentMilestone + 100;
  const progressToNext = ((karmaPoints - currentMilestone) / 100) * 100;

  // Determine badge level
  const getBadgeLevel = (points: number) => {
    if (points >= 1000) return { level: "Master", color: "text-purple-600", bg: "bg-purple-100" };
    if (points >= 500) return { level: "Expert", color: "text-blue-600", bg: "bg-blue-100" };
    if (points >= 250) return { level: "Advanced", color: "text-teal-600", bg: "bg-teal-100" };
    if (points >= 100) return { level: "Intermediate", color: "text-green-600", bg: "bg-green-100" };
    if (points >= 50) return { level: "Beginner", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Newcomer", color: "text-slate-600", bg: "bg-slate-100" };
  };

  const badge = getBadgeLevel(karmaPoints);

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-purple-600" />
          Karma Points
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                <Info className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-900">What are Karma Points?</h4>
                <p className="text-xs text-slate-600">
                  Karma points reflect your contributions to the SpareCarry community. You earn points by helping travelers deliver items successfully.
                </p>
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs font-medium text-slate-700">How you earn karma:</p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Complete deliveries successfully</li>
                    <li>Points are based on package weight and platform fee</li>
                    <li>Larger contributions earn more points</li>
                  </ul>
                </div>
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs font-medium text-slate-700">How karma helps:</p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Build your reputation in the community</li>
                    <li>Unlock badges and achievements</li>
                    <li>Show your commitment to helping others</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Points */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-purple-600">{karmaPoints}</div>
            <div className="text-sm text-slate-600">Total karma points</div>
          </div>
          <div className={`px-3 py-1 rounded-full ${badge.bg} ${badge.color} text-sm font-medium`}>
            <Trophy className="h-4 w-4 inline mr-1" />
            {badge.level}
          </div>
        </div>

        {/* Progress Bar */}
        {karmaPoints < 1000 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Progress to {nextMilestone} points</span>
              <span>{Math.round(progressToNext)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{currentMilestone}</span>
              <span>{nextMilestone}</span>
            </div>
          </div>
        )}

        {/* Milestone Achievements */}
        {karmaPoints >= 100 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>You&apos;ve reached the {badge.level} level!</span>
            </div>
          </div>
        )}

        {/* How to Earn More */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-slate-700 mb-1">How to earn more:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Complete more deliveries</li>
            <li>• Help with larger packages</li>
            <li>• Maintain a high completion rate</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

