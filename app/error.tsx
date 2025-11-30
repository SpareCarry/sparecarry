"use client";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600">
            Our team has been notified automatically. You can try again or head
            back to safety.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="break-words font-mono text-xs text-red-600">
                {error.message}
                {error.digest ? ` (digest: ${error.digest})` : null}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-500">
                    Stack trace
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto text-xs text-red-600">
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
            className="w-full bg-teal-600 text-white hover:bg-teal-700"
          >
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
