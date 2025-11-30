"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
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
import { Search, Loader2, DollarSign, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const FIRST_50_DELIVERIES = 50;

export function PayoutsTable() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: payouts, isLoading } = useQuery<any[]>({
    queryKey: ["admin-payouts", searchQuery],
    queryFn: async () => {
      // Get completed matches with delivery confirmations
      let query = supabase
        .from("matches")
        .select(
          `
          *,
          trips!inner(users(email), profiles(stripe_account_id)),
          requests!inner(users(email)),
          deliveries(confirmed_at, auto_release_at)
        `
        )
        .in("status", ["completed", "delivered"])
        .order("updated_at", { ascending: false })
        .limit(100); // Get recent ones

      const { data, error } = await query;
      if (error) throw error;

      // Filter to first 50 deliveries that need manual payout
      const completedDeliveries = (data || []).filter((match: any) => {
        const delivery = Array.isArray(match.deliveries)
          ? match.deliveries[0]
          : match.deliveries;
        return delivery?.confirmed_at || delivery?.auto_release_at;
      });

      return completedDeliveries.slice(0, FIRST_50_DELIVERIES);
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async ({
      matchId,
      stripeAccountId,
      amount,
    }: {
      matchId: string;
      stripeAccountId: string;
      amount: number;
    }) => {
      // Call API to process Stripe transfer
      const response = await fetch("/api/admin/process-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          stripeAccountId,
          amount: Math.round(amount * 100), // Convert to cents
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process payout");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const needsManualPayout = (payout: any) => {
    const delivery = Array.isArray(payout.deliveries)
      ? payout.deliveries[0]
      : payout.deliveries;
    const tripProfiles = Array.isArray(payout.trips?.profiles)
      ? payout.trips.profiles
      : payout.trips?.profiles
        ? [payout.trips.profiles]
        : [];
    const hasStripeAccount = !!tripProfiles[0]?.stripe_account_id;
    const isCompleted = payout.status === "completed";
    const hasConfirmation =
      !!delivery?.confirmed_at || !!delivery?.auto_release_at;

    // Check if this is in the first 50 deliveries
    const deliveryIndex = payouts?.indexOf(payout) ?? -1;
    const isFirst50 = deliveryIndex < FIRST_50_DELIVERIES;

    return hasStripeAccount && isCompleted && hasConfirmation && isFirst50;
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Manual Payouts:</strong> The first {FIRST_50_DELIVERIES}{" "}
          deliveries require manual Stripe transfers. After that, payouts will
          be automated.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
          <Input
            placeholder="Search payouts..."
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
              <TableHead>Traveler</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Platform Fee</TableHead>
              <TableHead>Payout Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confirmed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts?.map((payout: any) => {
              const trip = payout.trips;
              const delivery = Array.isArray(payout.deliveries)
                ? payout.deliveries[0]
                : payout.deliveries;
              const tripProfiles = Array.isArray(trip?.profiles)
                ? trip.profiles
                : trip?.profiles
                  ? [trip.profiles]
                  : [];
              const stripeAccountId = tripProfiles[0]?.stripe_account_id;
              const platformFeePercent = trip?.type === "plane" ? 0.18 : 0.15;
              const platformFee = payout.reward_amount * platformFeePercent;
              const payoutAmount = payout.reward_amount - platformFee;
              const requiresManualPayout = needsManualPayout(payout);
              const isProcessing = processPayoutMutation.isPending;

              return (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        Match #{payout.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {payout.requests?.from_location} →{" "}
                        {payout.requests?.to_location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {trip?.users?.email || "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${payout.reward_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    ${platformFee.toFixed(2)} ({platformFeePercent * 100}%)
                  </TableCell>
                  <TableCell className="font-semibold text-teal-600">
                    ${payoutAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {payout.status === "completed" ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline">{payout.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {delivery?.confirmed_at
                      ? format(new Date(delivery.confirmed_at), "MMM d, yyyy")
                      : delivery?.auto_release_at
                        ? format(
                            new Date(delivery.auto_release_at),
                            "MMM d, yyyy"
                          ) + " (auto)"
                        : "—"}
                  </TableCell>
                  <TableCell>
                    {requiresManualPayout && stripeAccountId ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          processPayoutMutation.mutate({
                            matchId: payout.id,
                            stripeAccountId,
                            amount: payoutAmount,
                          })
                        }
                        disabled={isProcessing}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <DollarSign className="mr-1 h-4 w-4" />
                            Process Payout
                          </>
                        )}
                      </Button>
                    ) : !stripeAccountId ? (
                      <span className="text-xs text-slate-400">
                        No Stripe account
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-green-600">
                        Automated
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {payouts?.length === 0 && (
        <div className="py-12 text-center text-slate-500">No payouts found</div>
      )}
    </div>
  );
}
