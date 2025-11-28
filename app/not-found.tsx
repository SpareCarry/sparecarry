'use client';

import Link from "next/link";
import { useEffect } from "react";
import { serverLogger } from "@/lib/logger/server-logger";

export default function NotFound() {
  useEffect(() => {
    // Log 404 in client (will also be logged in middleware/server)
    if (typeof window !== 'undefined') {
      const url = window.location.pathname;
      console.error(`[404] Page not found: ${url}`);
      console.error(`[404] Full URL: ${window.location.href}`);
      console.error(`[404] Referrer: ${document.referrer || 'Direct navigation'}`);
      
      // Try to log to server if possible
      try {
        fetch('/api/log-404', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: window.location.href,
            pathname: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          }),
        }).catch(() => {
          // Ignore errors - logging is best effort
        });
      } catch (e) {
        // Ignore errors
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-teal-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

