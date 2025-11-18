"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { playNotificationSound } from "@/lib/notifications/expo-notifications";

interface NegotiationButtonsProps {
  proposedAmount: number;
  matchId: string;
  currentReward: number;
  isRequester: boolean;
  onAccept?: () => void; // Callback to trigger payment flow
}

export function NegotiationButtons({
  proposedAmount,
  matchId,
  currentReward,
  isRequester,
  onAccept,
}: NegotiationButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Calculate counter amounts (±10% or ±$20, whichever is larger)
  const counterLower = Math.max(
    Math.round(proposedAmount * 0.9),
    proposedAmount - 20,
    50 // Minimum $50
  );
  const counterHigher = Math.min(
    Math.round(proposedAmount * 1.1),
    proposedAmount + 20,
    10000 // Maximum $10,000
  );

  const acceptMutation = useMutation({
    mutationFn: async () => {
      // Update match reward amount
      const { error } = await supabase
        .from("matches")
        .update({ reward_amount: proposedAmount })
        .eq("id", matchId);

      if (error) throw error;

      // Send acceptance message
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .single();

      if (conversation) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content: `Deal at $${proposedAmount.toFixed(0)} – sending escrow now 🚀`,
        });
      }

      // Play cash register sound
      playNotificationSound("cash_register");

      // Send notification to other party
      await fetch("/api/notifications/send-counter-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          recipientId: isRequester ? undefined : undefined, // Will need to get from match
          newRewardAmount: proposedAmount,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
      
      // Trigger payment flow if requester accepted
      if (isRequester && onAccept) {
        onAccept();
      }
    },
  });

  const counterMutation = useMutation({
    mutationFn: async (counterAmount: number) => {
      // Update match reward amount
      const { error } = await supabase
        .from("matches")
        .update({ reward_amount: counterAmount })
        .eq("id", matchId);

      if (error) throw error;

      // Send counter message
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .single();

      if (conversation) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const counterMessage =
          counterAmount < proposedAmount
            ? `Can do $${counterAmount.toFixed(0)} if we meet at the fuel dock`
            : `Happy to pay $${counterAmount.toFixed(0)} if you wrap it well`;

        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content: counterMessage,
        });
      }

      // Play notification sound
      playNotificationSound("cash_register");

      // Send notification
      await fetch("/api/notifications/send-counter-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          newRewardAmount: counterAmount,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
    },
  });

  const handleAccept = async () => {
    setLoading("accept");
    try {
      await acceptMutation.mutateAsync();
    } catch (error) {
      console.error("Error accepting price:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleCounter = async (amount: number) => {
    setLoading(`counter-${amount}`);
    try {
      await counterMutation.mutateAsync(amount);
    } catch (error) {
      console.error("Error countering price:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 my-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-slate-900">
            Price Proposed: ${proposedAmount.toFixed(0)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Accept Button */}
          <Button
            onClick={handleAccept}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700 text-white h-14 text-base font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Accept ${proposedAmount.toFixed(0)}
          </Button>

          {/* Counter Lower */}
          <Button
            onClick={() => handleCounter(counterLower)}
            disabled={loading !== null}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 h-14 text-base font-semibold"
          >
            <ArrowDownLeft className="h-5 w-5 mr-2" />
            Counter ${counterLower.toFixed(0)}
          </Button>

          {/* Counter Higher */}
          <Button
            onClick={() => handleCounter(counterHigher)}
            disabled={loading !== null}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 h-14 text-base font-semibold"
          >
            <ArrowUpRight className="h-5 w-5 mr-2" />
            Counter ${counterHigher.toFixed(0)}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          {isRequester
            ? "Accept to proceed to payment"
            : "Accept to confirm the deal"}
        </p>
      </CardContent>
    </Card>
  );
}

