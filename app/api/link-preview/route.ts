/**
 * API Route for fetching link previews
 *
 * Fetches Open Graph and meta tags from URLs
 */

import { NextRequest, NextResponse } from "next/server";

const APPROVED_DOMAINS = ["sparecarry.com", "stripe.com"];

function isApprovedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return APPROVED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Only allow approved domains
  if (!isApprovedDomain(url)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SpareCarry/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract Open Graph and meta tags
    const titleMatch =
      html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
      html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const title = titleMatch ? titleMatch[1] : null;

    const descriptionMatch =
      html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
      html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : null;

    const imageMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/i
    );
    const image = imageMatch ? imageMatch[1] : null;

    const siteNameMatch = html.match(
      /<meta\s+property="og:site_name"\s+content="([^"]+)"/i
    );
    const siteName = siteNameMatch ? siteNameMatch[1] : null;

    return NextResponse.json({
      title: title || undefined,
      description: description || undefined,
      image: image || undefined,
      siteName: siteName || undefined,
    });
  } catch (error) {
    console.error("Error fetching link preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}
