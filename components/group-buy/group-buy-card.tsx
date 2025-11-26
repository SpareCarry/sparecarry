"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Users, Percent, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface GroupBuyCardProps {
  groupBuy: {
    id: string;
    trip_id: string;
    from_location: string;
    to_location: string;
    max_participants: number;
    current_participants: number;
    status: string;
    discount_percent: number;
  };
  onJoin?: () => void;
}

type RequestRecord = {
  id: string;
};

export function GroupBuyCard({ groupBuy, onJoin }: GroupBuyCardProps) {
  const t = useTranslations("groupBuy");
  const [joining, setJoining] = useState(false);
  const supabase = createClient() as SupabaseClient;

  const handleJoin = async () => {
    setJoining(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in to join group buy");
        return;
      }

      // Check if user already in group buy
      const { data: userRequest } = await supabase
        .from("requests")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const requestRecord = (userRequest ?? null) as RequestRecord | null;

      let existingMatch: { id: string } | null = null;
      if (requestRecord?.id) {
        const { data } = await supabase
          .from("matches")
          .select("id")
          .eq("group_buy_id", groupBuy.id)
          .eq("request_id", requestRecord.id)
          .maybeSingle();
        existingMatch = data as { id: string } | null;
      }

      if (existingMatch?.id) {
        alert("You're already in this group buy");
        return;
      }

      // Create request and match (simplified - in production, user selects item details)
      onJoin?.();
    } catch (error) {
      console.error("Error joining group buy:", error);
      const message =
        error instanceof Error ? error.message : "Failed to join group buy";
      alert(message);
    } finally {
      setJoining(false);
    }
  };

  const isFull = groupBuy.current_participants >= groupBuy.max_participants;
  const canJoin = !isFull && groupBuy.status === "open";

  return (
    <Card className="border-teal-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-600" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="font-medium">
            {groupBuy.from_location} → {groupBuy.to_location}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm">
              {groupBuy.current_participants} / {groupBuy.max_participants}{" "}
              {t("participants")}
            </span>
          </div>
          {groupBuy.discount_percent > 0 && (
            <Badge className="bg-green-100 text-green-800">
              <Percent className="h-3 w-3 mr-1" />
              {groupBuy.discount_percent}% {t("discount")}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant={
              groupBuy.status === "open"
                ? "default"
                : groupBuy.status === "full"
                ? "secondary"
                : "outline"
            }
          >
            {t(groupBuy.status as any)}
          </Badge>

          {canJoin && (
            <Button
              onClick={handleJoin}
              disabled={joining}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              {joining ? t("loading") : t("join")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

