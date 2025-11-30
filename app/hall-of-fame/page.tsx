"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Trophy, Anchor, Loader2 } from "lucide-react";
import { SupporterBadge } from "../../components/badges/supporter-badge";
import { format } from "date-fns";

export default function HallOfFamePage() {
  const supabase = createClient();

  const { data: supporters, isLoading } = useQuery({
    queryKey: ["hall-of-fame"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          supporter_purchased_at,
          profiles!inner(boat_name)
        `
        )
        .eq("supporter_status", "active")
        .order("supporter_purchased_at", { ascending: true }); // Oldest supporters first

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-slate-900">Hall of Fame</h1>
        <p className="text-lg text-slate-600">
          The early supporters who believed in SpareCarry from the start
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-teal-50 px-4 py-2">
          <SupporterBadge size="sm" />
          <span className="text-sm text-slate-700">
            {supporters?.length || 0}{" "}
            {supporters?.length === 1 ? "Supporter" : "Supporters"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {supporters && supporters.length > 0 ? (
          supporters.map((supporter: any, index: number) => {
            const profile = Array.isArray(supporter.profiles)
              ? supporter.profiles[0]
              : supporter.profiles;
            const displayName =
              profile?.boat_name ||
              supporter.email?.split("@")[0] ||
              "Anonymous";

            return (
              <Card
                key={supporter.id}
                className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-teal-50/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-teal-600 font-bold text-white">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {displayName}
                          </span>
                          <SupporterBadge size="sm" showText={false} />
                        </div>
                        <p className="text-sm text-slate-500">
                          Joined{" "}
                          {supporter.supporter_purchased_at
                            ? format(
                                new Date(supporter.supporter_purchased_at),
                                "MMMM d, yyyy"
                              )
                            : "Early"}
                        </p>
                      </div>
                    </div>
                    <Anchor className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-600">
                Be the first Supporter! Your name will appear here forever.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Supporters are listed in order of purchase. Early backers get bragging
          rights forever.
        </p>
      </div>
    </div>
  );
}
