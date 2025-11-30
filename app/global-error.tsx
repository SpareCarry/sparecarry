"use client";

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
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600">
              Our team has been notified automatically. You can try again or
              head back to safety.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="break-words text-xs text-red-600">
                {error.message}
                {error.digest ? ` (digest: ${error.digest})` : null}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={reset}
              className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition hover:bg-teal-700"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-center font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
