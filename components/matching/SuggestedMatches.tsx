/**
 * Suggested Matches Component
 * 
 * Displays suggested matches for a trip or request with confidence scores
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, MapPin, Calendar, Package, TrendingUp, MessageSquare } from 'lucide-react';
import { findMatches, MatchSuggestion, getConfidenceLabel } from '../../lib/matching/smart-matching';
import { TrustBadges } from '../TrustBadges';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';

export interface SuggestedMatchesProps {
  postType: 'trip' | 'request';
  postId: string;
  currentUserId: string;
  maxSuggestions?: number;
  onMatchClick?: (suggestion: MatchSuggestion) => void;
}

export function SuggestedMatches({
  postType,
  postId,
  currentUserId,
  maxSuggestions = 5,
  onMatchClick,
}: SuggestedMatchesProps) {
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadSuggestions() {
      setIsLoading(true);
      setError(null);

      try {
        const matches = await findMatches({ type: postType, id: postId });
        setSuggestions(matches.slice(0, maxSuggestions));
      } catch (err) {
        console.error('Error loading suggestions:', err);
        setError('Failed to load suggestions');
      } finally {
        setIsLoading(false);
      }
    }

    if (postId) {
      loadSuggestions();
    }
  }, [postId, postType, maxSuggestions]);

  const handleMatchClick = (suggestion: MatchSuggestion) => {
    if (onMatchClick) {
      onMatchClick(suggestion);
    } else {
      // Default: navigate to create match/message
      const matchId = suggestion.candidate.tripId + '-' + suggestion.candidate.requestId;
      router.push(`/home/messages/${matchId}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-slate-500 text-center">No matches found at this time</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          Suggested Matches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const { candidate, trip, request, traveler } = suggestion;
          const isRequest = postType === 'trip';

          return (
            <div
              key={`${candidate.tripId}-${candidate.requestId}`}
              className="border border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">
                    {isRequest ? trip.from_location + ' → ' + trip.to_location : request.title}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {isRequest
                        ? `${request.from_location} → ${request.to_location}`
                        : `${trip.from_location} → ${trip.to_location}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      candidate.confidence === 'high'
                        ? 'default'
                        : candidate.confidence === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {getConfidenceLabel(candidate.confidence)}
                  </Badge>
                  <div className="text-xs text-slate-500">
                    {candidate.score}% match
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isRequest
                      ? `Deadline: ${new Date(request.deadline_latest).toLocaleDateString()}`
                      : `Departure: ${new Date(trip.departure_date).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>
                    {isRequest ? `${request.weight_kg}kg` : `${trip.spare_kg}kg available`}
                  </span>
                </div>
              </div>

              {traveler && (
                <div className="mb-3">
                  <TrustBadges
                    reliability_score={traveler.reliability_score}
                    premium_member={traveler.subscription_status === 'active'}
                    size="sm"
                  />
                </div>
              )}

              <Button
                size="sm"
                onClick={() => handleMatchClick(suggestion)}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact {isRequest ? 'Requester' : 'Traveler'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

