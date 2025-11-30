/**
 * Safety Badge Component
 *
 * Displays safety score with collapsible reasons
 */

"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

interface SafetyBadgeProps {
  score: number;
  reasons?: string[];
  collapsible?: boolean;
}

export function SafetyBadge({
  score,
  reasons = [],
  collapsible = true,
}: SafetyBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 30) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Safe";
    if (score >= 60) return "Acceptable";
    if (score >= 30) return "Risky";
    return "High Risk";
  };

  return (
    <Card className={`border-2 ${getScoreColor(score)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base">Safety Score</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs opacity-75">{getScoreLabel(score)}</div>
            </div>
            {collapsible && reasons.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded p-1 hover:bg-white/20"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      {(isExpanded || !collapsible) && reasons.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-1">
            {reasons.map((reason, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
