/**
 * LinkPreview Component
 *
 * Displays rich preview cards for approved URLs
 */

"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  fetchLinkPreview,
  isApprovedUrl,
  LinkPreview,
} from "../../lib/utils/link-preview";
import { cn } from "../../lib/utils";
import Image from "next/image";

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export function LinkPreviewCard({ url, className }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApprovedUrl(url)) {
      setLoading(false);
      return;
    }

    fetchLinkPreview(url)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [url]);

  if (!isApprovedUrl(url) || loading || !preview) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block overflow-hidden rounded-lg border border-slate-200 transition-colors hover:border-teal-300",
        className
      )}
    >
      {preview.image && (
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <Image
            src={preview.image}
            alt={preview.title || "Link preview"}
            fill
            className="object-cover"
            unoptimized={
              preview.image.startsWith("blob:") ||
              preview.image.startsWith("data:")
            }
          />
        </div>
      )}
      <div className="space-y-1 p-3">
        {preview.siteName && (
          <p className="text-xs uppercase text-slate-500">{preview.siteName}</p>
        )}
        {preview.title && (
          <p className="line-clamp-2 text-sm font-semibold text-slate-900">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="line-clamp-2 text-xs text-slate-600">
            {preview.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-teal-600">
          <ExternalLink className="h-3 w-3" />
          <span>{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
}
