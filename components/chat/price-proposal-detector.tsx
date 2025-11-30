"use client";

import { useMemo } from "react";

// Detect price proposals in message content
// Matches patterns like: "$420", "$420.", "420 dollars", "420$", etc.
const PRICE_PATTERNS = [
  /\$(\d+(?:\.\d{2})?)/g, // $420, $420.50
  /(\d+(?:\.\d{2})?)\s*dollars?/gi, // 420 dollars
  /(\d+(?:\.\d{2})?)\s*usd/gi, // 420 USD
  /(\d+(?:\.\d{2})?)\$/g, // 420$
  /price[:\s]+(\d+(?:\.\d{2})?)/gi, // price: 420
  /offer[:\s]+(\d+(?:\.\d{2})?)/gi, // offer: 420
  /reward[:\s]+(\d+(?:\.\d{2})?)/gi, // reward: 420
];

export interface PriceProposal {
  amount: number;
  originalText: string;
}

export function detectPriceProposal(content: string): PriceProposal | null {
  const prices: number[] = [];
  let matchedText = "";

  for (const pattern of PRICE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const amount = parseFloat(match[1]);
      if (amount > 0 && amount < 100000) {
        // Reasonable price range
        prices.push(amount);
        if (!matchedText) {
          matchedText = match[0];
        }
      }
    }
  }

  if (prices.length > 0) {
    // Take the largest price mentioned (most likely the proposal)
    const maxPrice = Math.max(...prices);
    return {
      amount: maxPrice,
      originalText: matchedText,
    };
  }

  return null;
}
