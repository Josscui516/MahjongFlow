"use client";

import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";

export default function BackofficeError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Back-office route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <div className="w-full max-w-4xl">
        <RouteErrorFeedback
          actions={
            <>
              <button
                className={PRIMARY_ROUTE_ACTION_CLASS}
                onClick={retry}
                type="button"
              >
                Try again
              </button>
              <a className={SECONDARY_ROUTE_ACTION_CLASS} href="/login">
                Return to sign in
              </a>
            </>
          }
          description="The secure workspace could not be prepared. Retry access verification, or return to sign in if your session has expired."
          recoveryItems={[
            "Retry access verification",
            "Return to sign in if the session is no longer valid",
          ]}
          title="Back office unavailable"
        />
      </div>
    </main>
  );
}
