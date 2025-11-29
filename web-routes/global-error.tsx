'use client';

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-6 space-y-4 border border-slate-100">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-600">
              Our team has been notified automatically. You can try again or head back to safety.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-600 break-words">
                {error.message}
                {error.digest ? ` (digest: ${error.digest})` : null}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={reset}
              className="w-full rounded-lg bg-teal-600 text-white px-4 py-2 font-medium hover:bg-teal-700 transition"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="w-full text-center rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

