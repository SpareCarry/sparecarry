/**
 * Feed Card Skeleton Component
 * 
 * Skeleton loading state for feed cards that matches the FeedCard layout
 */

import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

export function FeedCardSkeleton() {
  return (
    <Card className="border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Left side - Icon/Badge area */}
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Center - Main content */}
          <div className="flex-1 space-y-3">
            {/* Header with location and badge */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </div>

            {/* Date/Deadline info */}
            <Skeleton className="h-4 w-40" />

            {/* Capacity/Reward info */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Footer with match score */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

