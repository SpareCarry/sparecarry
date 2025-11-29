'use client';

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-6 space-y-4 border border-slate-100">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-600">
            Our team has been notified automatically. You can try again or head back to safety.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 break-words font-mono">
                {error.message}
                {error.digest ? ` (digest: ${error.digest})` : null}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-500 cursor-pointer">Stack trace</summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={reset}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

