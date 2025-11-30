import { cn } from "@/lib/utils";

/**
 * Skeleton Loading Component
 *
 * A simple loading placeholder that animates to indicate loading state
 */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

/**
 * Text Skeleton - for loading text content
 */
function SkeletonText({
  className,
  lines = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && "w-3/4" // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

/**
 * Avatar Skeleton - for loading avatars
 */
function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  );
}

/**
 * Card Skeleton - for loading cards
 */
function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 p-4 dark:border-slate-800",
        className
      )}
      {...props}
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <SkeletonText lines={2} />
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Feed Item Skeleton - for loading feed items
 */
function SkeletonFeedItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      <div className="flex gap-4">
        {/* Image placeholder */}
        <Skeleton className="h-20 w-20 rounded-md" />

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <SkeletonText lines={2} />

          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Form Skeleton - for loading forms
 */
function SkeletonForm({
  className,
  fields = 5,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { fields?: number }) {
  return (
    <div
      className={cn(
        "space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton - for loading tables
 */
function SkeletonTable({
  className,
  rows = 5,
  cols = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex gap-4 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonFeedItem,
  SkeletonForm,
  SkeletonTable,
};
