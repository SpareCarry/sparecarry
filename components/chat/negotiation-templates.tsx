"use client";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { MessageSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";

interface NegotiationTemplatesProps {
  matchId: string;
  proposedAmount: number;
  currentReward: number;
  isRequester: boolean;
}

export function NegotiationTemplates({
  matchId,
  proposedAmount,
  currentReward,
  isRequester,
}: NegotiationTemplatesProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Calculate template amounts
  const lowerAmount = Math.max(
    Math.round(proposedAmount * 0.93),
    proposedAmount - 30,
    50
  );
  const higherAmount = Math.min(
    Math.round(proposedAmount * 1.07),
    proposedAmount + 30,
    10000
  );

  const templates = isRequester
    ? [
        `Happy to pay $${higherAmount.toFixed(0)} if you wrap it well`,
        `Can do $${lowerAmount.toFixed(0)} if we meet at the fuel dock`,
        `Deal at $${proposedAmount.toFixed(0)} – sending escrow now 🚀`,
        `$${proposedAmount.toFixed(0)} works – let's proceed`,
        `I can do $${lowerAmount.toFixed(0)} if you handle customs paperwork`,
        `$${higherAmount.toFixed(0)} if you deliver to the marina`,
      ]
    : [
        `Can do $${lowerAmount.toFixed(0)} if we meet at the fuel dock`,
        `Happy to accept $${proposedAmount.toFixed(0)} – when can you send escrow?`,
        `Deal at $${proposedAmount.toFixed(0)} – ready when you are ⚓`,
        `$${lowerAmount.toFixed(0)} works if you're flexible on meetup location`,
        `I'll take $${proposedAmount.toFixed(0)} – send payment when ready`,
        `$${higherAmount.toFixed(0)} if you need it wrapped extra well`,
      ];

  const sendTemplateMutation = useMutation({
    mutationFn: async (template: string) => {
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .single();

      if (!conversation) throw new Error("Conversation not found");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user!.id,
        content: template,
      });

      if (error) throw error;

      // If template contains a price, update match reward
      const priceMatch = template.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        const amount = parseFloat(priceMatch[1]);
        await supabase
          .from("matches")
          .update({ reward_amount: amount })
          .eq("id", matchId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  return (
    <Card className="border-slate-200 bg-slate-50 my-2">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">
            Quick Replies
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template, idx) => (
            <Button
              key={idx}
              onClick={() => sendTemplateMutation.mutate(template)}
              disabled={sendTemplateMutation.isPending}
              variant="outline"
              size="sm"
              className="text-xs h-auto py-2 px-3 text-left justify-start whitespace-normal border-slate-200 hover:bg-white hover:border-teal-300"
            >
              {template}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

