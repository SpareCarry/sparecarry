/**
 * Top Routes Component
 * 
 * Displays trending/active routes from top_routes view
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, TrendingUp, MapPin, Package } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

export interface TopRoute {
  route_hash: string;
  from_location: string;
  to_location: string;
  post_count: number;
  match_count: number;
  last_activity: string;
  active_posts_30d: number;
}

export interface TopRoutesProps {
  limit?: number;
  showMatchCount?: boolean;
  className?: string;
}

export function TopRoutes({
  limit = 10,
  showMatchCount = true,
  className,
}: TopRoutesProps) {
  const [routes, setRoutes] = useState<TopRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadTopRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        // Refresh materialized view first (optional, can be done via cron)
        // await supabase.rpc('refresh_top_routes');

        const { data, error: fetchError } = await supabase
          .from('top_routes')
          .select('*')
          .order('active_posts_30d', { ascending: false })
          .order('match_count', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setRoutes(data || []);
      } catch (err) {
        console.error('Error loading top routes:', err);
        setError('Failed to load top routes');
      } finally {
        setIsLoading(false);
      }
    }

    loadTopRoutes();
  }, [limit, supabase]);

  if (isLoading) {
    return (
      <Card className={className}>
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
      <Card className={className}>
        <CardContent className="py-8">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <p className="text-sm text-slate-500 text-center">No active routes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          Top Routes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {routes.map((route, index) => (
            <div
              key={route.route_hash}
              className="flex items-start justify-between p-3 border border-slate-200 rounded-lg hover:border-teal-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900">
                    {route.from_location} → {route.to_location}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 ml-6">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {route.active_posts_30d} active
                  </span>
                  {showMatchCount && (
                    <span>{route.match_count} matches</span>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="ml-2">
                {route.active_posts_30d}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

