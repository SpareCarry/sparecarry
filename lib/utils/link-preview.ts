/**
 * Link Preview Utility
 *
 * Fetches metadata for URLs to display rich previews
 * Only works for approved domains (e.g., SpareCarry.com)
 */

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

const APPROVED_DOMAINS = ["sparecarry.com", "stripe.com"];

/**
 * Check if a URL is from an approved domain
 */
export function isApprovedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    return APPROVED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Fetch link preview metadata
 * Note: This is a client-side implementation. For production, consider using a backend service
 * to avoid CORS issues and improve performance.
 */
export async function fetchLinkPreview(
  url: string
): Promise<LinkPreview | null> {
  if (!isApprovedUrl(url)) {
    return null;
  }

  try {
    // For client-side, we'll use a simple approach
    // In production, you might want to use a backend API or service like LinkPreview API
    const response = await fetch(
      `/api/link-preview?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      url,
      title: data.title,
      description: data.description,
      image: data.image,
      siteName: data.siteName,
    };
  } catch (error) {
    console.warn("Failed to fetch link preview:", error);
    return null;
  }
}
