"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

const HIGH_VALUE_THRESHOLD = 1000; // $1000+
const FIRST_THREE_MONTHS_DAYS = 90;

export function MatchesTable() {
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: matches, isLoading } = useQuery({
    queryKey: ["admin-matches", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("matches")
        .select(
          `
          *,
          trips(from_location, to_location, type, users(email)),
          requests(title, from_location, to_location, users(email))
        `
        )
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `trips.from_location.ilike.%${searchQuery}%,trips.to_location.ilike.%${searchQuery}%,requests.title.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const approveMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from("matches")
        .update({ status: "chatting" })
        .eq("id", matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - FIRST_THREE_MONTHS_DAYS);

  const needsApproval = (match: any) => {
    const isHighValue = match.reward_amount >= HIGH_VALUE_THRESHOLD;
    const isFirstThreeMonths = new Date(match.created_at) >= threeMonthsAgo;
    const isPending = match.status === "pending";
    return isHighValue && isFirstThreeMonths && isPending;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
          <Input
            placeholder="Search by route or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches?.map((match: any) => {
              const trip = match.trips;
              const request = match.requests;
              const requiresApproval = needsApproval(match);

              return (
                <TableRow key={match.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request?.title || "Trip Match"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {trip?.users?.email} ↔ {request?.users?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request?.from_location || trip?.from_location} →{" "}
                      {request?.to_location || trip?.to_location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${match.reward_amount?.toLocaleString()}
                    </div>
                    {requiresApproval && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-amber-600 text-amber-600"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Needs Approval
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{match.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(match.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {requiresApproval && (
                      <Button
                        size="sm"
                        onClick={() => approveMatchMutation.mutate(match.id)}
                        disabled={approveMatchMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {approveMatchMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {matches?.length === 0 && (
        <div className="py-12 text-center text-slate-500">No matches found</div>
      )}
    </div>
  );
}
