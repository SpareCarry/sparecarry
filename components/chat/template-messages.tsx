"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Ship, DollarSign } from "lucide-react";

interface TemplateMessagesProps {
  onSelect: (message: string) => void;
  match: any;
  isRequester: boolean;
}

export function TemplateMessages({
  onSelect,
  match,
  isRequester,
}: TemplateMessagesProps) {
  const trip = match.trips;
  const request = match.requests;

  const templates = isRequester
    ? [
        {
          icon: MessageCircle,
          text: "Hi! I can take your item – when/where should we meet?",
        },
        {
          icon: Ship,
          text: trip.type === "boat" ? "Here's my boat: [photo]" : "Here's my flight: [details]",
        },
        {
          icon: DollarSign,
          text: `Agreed on $${match.reward_amount.toLocaleString()}?`,
        },
      ]
    : [
        {
          icon: MessageCircle,
          text: "Thanks! I can meet at [location] on [date]",
        },
        {
          icon: DollarSign,
          text: "Yes, $${match.reward_amount.toLocaleString()} works for me!",
        },
      ];

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-2">Quick messages:</p>
      <div className="flex flex-wrap gap-2">
        {templates.map((template, index) => {
          const Icon = template.icon;
          return (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelect(template.text)}
              className="text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {template.text}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

