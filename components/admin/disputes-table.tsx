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
import { Search, Loader2, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export function DisputesTable() {
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  interface DisputeMatch {
    id: string;
    status: string;
    reward_amount: number;
    trips: {
      from_location: string;
      to_location: string;
      users: { email: string } | null;
    } | null;
    requests: {
      title: string;
      from_location: string;
      to_location: string;
      users: { email: string } | null;
    } | null;
    deliveries: {
      dispute_opened_at: string | null;
      proof_photos: string[];
    } | null;
    updated_at: string;
  }

  const { data: disputes, isLoading } = useQuery<DisputeMatch[]>({
    queryKey: ["admin-disputes", searchQuery],
    queryFn: async () => {
      // Get matches with disputes (status = 'disputed')
      const query = supabase
        .from("matches")
        .select(
          `
          *,
          trips(from_location, to_location, users(email)),
          requests(title, from_location, to_location, users(email)),
          deliveries(dispute_opened_at, proof_photos)
        `
        )
        .eq("status", "disputed")
        .order("updated_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DisputeMatch[];
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({
      matchId,
      resolution,
    }: {
      matchId: string;
      resolution: "requester" | "traveler" | "refund";
    }) => {
      // Update match status based on resolution
      let newStatus = "completed";
      if (resolution === "refund") {
        // Refund would be handled separately via Stripe
        newStatus = "cancelled";
      }

      const { error } = await supabase
        .from("matches")
        .update({ status: newStatus } as { status: string })
        .eq("id", matchId);

      if (error) throw error;

      // Handle refunds via Stripe API if resolution === "refund"
      // TODO: requires Stripe API integration for refund processing
      // This should:
      // 1. Retrieve the payment intent ID from the match
      // 2. Create a refund via Stripe API
      // 3. Update match status and log refund transaction
      if (resolution === "refund") {
        // TODO: Implement Stripe refund logic
        // const { stripe } = await import("@/lib/stripe/server");
        // const paymentIntentId = match.payment_intent_id;
        // await stripe.refunds.create({ payment_intent: paymentIntentId });
        console.warn("Refund functionality requires Stripe API integration");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search disputes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Disputed At</TableHead>
              <TableHead>Parties</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes?.map((dispute) => {
              const trip = dispute.trips;
              const request = dispute.requests;
              const delivery = Array.isArray(dispute.deliveries) ? dispute.deliveries[0] : dispute.deliveries;

              return (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request?.title || "Trip Match"}</div>
                      <Badge variant="outline" className="mt-1 text-red-600 border-red-600">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Disputed
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request?.from_location || trip?.from_location} →{" "}
                      {request?.to_location || trip?.to_location}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${dispute.reward_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {delivery?.dispute_opened_at
                      ? format(new Date(delivery.dispute_opened_at), "MMM d, yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{trip?.users?.email}</div>
                      <div className="text-slate-500">{request?.users?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          resolveDisputeMutation.mutate({
                            matchId: dispute.id,
                            resolution: "requester",
                          })
                        }
                        disabled={resolveDisputeMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Favor Requester
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          resolveDisputeMutation.mutate({
                            matchId: dispute.id,
                            resolution: "traveler",
                          })
                        }
                        disabled={resolveDisputeMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Favor Traveler
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          resolveDisputeMutation.mutate({
                            matchId: dispute.id,
                            resolution: "refund",
                          })
                        }
                        disabled={resolveDisputeMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Refund
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {disputes?.length === 0 && (
        <div className="text-center py-12 text-slate-500">No disputes found</div>
      )}
    </div>
  );
}

